package httpapi_test

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/kerntau/blog/cms-api/internal/config"
	"github.com/kerntau/blog/cms-api/internal/database"
	"github.com/kerntau/blog/cms-api/internal/httpapi"
)

type apiResponse struct {
	Code int             `json:"code"`
	Data json.RawMessage `json:"data"`
}

func TestLoginCSRFAndContentWorkflow(t *testing.T) {
	router, databaseConnection := testRouter(t)
	defer databaseConnection.Close()

	login := request(t, router, http.MethodPost, "/api/v1/auth/login", map[string]string{"password": "a-secure-password"}, nil)
	if login.Code != http.StatusOK {
		t.Fatalf("login: got %d, body: %s", login.Code, login.Body.String())
	}
	var loginPayload apiResponse
	decode(t, login.Body.Bytes(), &loginPayload)
	if loginPayload.Code != 0 {
		t.Fatalf("login API code: %d", loginPayload.Code)
	}
	var session struct {
		CSRFToken string `json:"csrfToken"`
	}
	decode(t, loginPayload.Data, &session)
	if session.CSRFToken == "" {
		t.Fatal("expected CSRF token")
	}
	cookie := login.Result().Cookies()[0]

	unauthorized := request(t, router, http.MethodGet, "/api/v1/admin/posts", nil, nil)
	if unauthorized.Code != http.StatusUnauthorized {
		t.Fatalf("unauthorized posts: got %d", unauthorized.Code)
	}

	withoutCSRF := request(t, router, http.MethodPost, "/api/v1/admin/categories", map[string]interface{}{"slug": "security", "labelZh": "安全", "labelEn": "Security", "enabled": true}, cookie)
	if withoutCSRF.Code != http.StatusForbidden {
		t.Fatalf("missing csrf: got %d", withoutCSRF.Code)
	}

	categoryRequest := request(t, router, http.MethodPost, "/api/v1/admin/categories", map[string]interface{}{"slug": "security", "labelZh": "安全", "labelEn": "Security", "enabled": true}, cookie)
	categoryRequest.Header().Set("X-CSRF-Token", session.CSRFToken)
	// The request has already run when using request; create it explicitly for CSRF protected writes.
	categoryRequest = execute(t, router, http.MethodPost, "/api/v1/admin/categories", map[string]interface{}{"slug": "security", "labelZh": "安全", "labelEn": "Security", "enabled": true}, cookie, session.CSRFToken)
	if categoryRequest.Code != http.StatusCreated {
		t.Fatalf("create category: got %d, body: %s", categoryRequest.Code, categoryRequest.Body.String())
	}
	var categoryPayload apiResponse
	decode(t, categoryRequest.Body.Bytes(), &categoryPayload)
	var category struct {
		ID string `json:"id"`
	}
	decode(t, categoryPayload.Data, &category)

	postResponse := execute(t, router, http.MethodPost, "/api/v1/admin/posts", map[string]interface{}{"title": "First post", "slug": "first-post", "content": "# First post", "language": "zh", "categoryId": category.ID}, cookie, session.CSRFToken)
	if postResponse.Code != http.StatusCreated {
		t.Fatalf("create post: got %d, body: %s", postResponse.Code, postResponse.Body.String())
	}

	dashboard := execute(t, router, http.MethodGet, "/api/v1/admin/dashboard/summary", nil, cookie, "")
	if dashboard.Code != http.StatusOK {
		t.Fatalf("dashboard: got %d, body: %s", dashboard.Code, dashboard.Body.String())
	}
	var dashboardPayload apiResponse
	decode(t, dashboard.Body.Bytes(), &dashboardPayload)
	var summary struct {
		DraftPosts int `json:"draftPosts"`
		Categories int `json:"categories"`
	}
	decode(t, dashboardPayload.Data, &summary)
	if summary.DraftPosts != 1 || summary.Categories != 1 {
		t.Fatalf("unexpected summary: %+v", summary)
	}
}

func TestPublicContentOnlyReturnsPublishedPosts(t *testing.T) {
	router, databaseConnection := testRouter(t)
	defer databaseConnection.Close()
	login := request(t, router, http.MethodPost, "/api/v1/auth/login", map[string]string{"password": "a-secure-password"}, nil)
	var loginPayload apiResponse
	decode(t, login.Body.Bytes(), &loginPayload)
	var session struct {
		CSRFToken string `json:"csrfToken"`
	}
	decode(t, loginPayload.Data, &session)
	cookie := login.Result().Cookies()[0]
	published := execute(t, router, http.MethodPost, "/api/v1/admin/posts", map[string]interface{}{"title": "Published", "slug": "en/published", "content": "# Published", "language": "en"}, cookie, session.CSRFToken)
	var publishedPayload apiResponse
	decode(t, published.Body.Bytes(), &publishedPayload)
	var post struct {
		ID string `json:"id"`
	}
	decode(t, publishedPayload.Data, &post)
	if response := execute(t, router, http.MethodPost, "/api/v1/admin/posts/"+post.ID+"/publish", nil, cookie, session.CSRFToken); response.Code != http.StatusOK {
		t.Fatalf("publish: got %d", response.Code)
	}
	if response := request(t, router, http.MethodGet, "/api/v1/public/posts/en/published", nil, nil); response.Code != http.StatusOK {
		t.Fatalf("public post: got %d, body %s", response.Code, response.Body.String())
	}
	if response := request(t, router, http.MethodGet, "/api/v1/public/posts/missing", nil, nil); response.Code != http.StatusNotFound {
		t.Fatalf("missing public post: got %d", response.Code)
	}
	if response := request(t, router, http.MethodGet, "/api/v1/public/posts?page=1&pageSize=20", nil, nil); response.Code != http.StatusOK {
		t.Fatalf("public listing: got %d", response.Code)
	}
}

func TestSEOConfigurationDoesNotExposeSecrets(t *testing.T) {
	router, databaseConnection := testRouter(t)
	defer databaseConnection.Close()
	login := request(t, router, http.MethodPost, "/api/v1/auth/login", map[string]string{"password": "a-secure-password"}, nil)
	var loginPayload apiResponse
	decode(t, login.Body.Bytes(), &loginPayload)
	var session struct {
		CSRFToken string `json:"csrfToken"`
	}
	decode(t, loginPayload.Data, &session)
	cookie := login.Result().Cookies()[0]
	update := execute(t, router, http.MethodPatch, "/api/v1/admin/seo", map[string]interface{}{"title": "Site title", "description": "Site description", "keywords": "go,sqlite", "canonicalUrl": "https://example.com", "openGraphImageUrl": "https://example.com/og.png", "robotsEnabled": true, "sitemapEnabled": true, "rssEnabled": true, "jsonLdEnabled": true}, cookie, session.CSRFToken)
	if update.Code != http.StatusOK {
		t.Fatalf("update SEO: got %d, body %s", update.Code, update.Body.String())
	}
	get := execute(t, router, http.MethodGet, "/api/v1/admin/seo", nil, cookie, "")
	if get.Code != http.StatusOK {
		t.Fatalf("get SEO: got %d", get.Code)
	}
	if bytes.Contains(get.Body.Bytes(), []byte("secret")) {
		t.Fatal("SEO response must not expose secrets")
	}
}

func TestLoginRateLimitAndLogoutAll(t *testing.T) {
	router, databaseConnection := testRouter(t)
	defer databaseConnection.Close()
	for attempt := 0; attempt < 5; attempt++ {
		response := request(t, router, http.MethodPost, "/api/v1/auth/login", map[string]string{"password": "wrong-password"}, nil)
		if response.Code != http.StatusUnauthorized {
			t.Fatalf("failed login %d: got %d", attempt, response.Code)
		}
	}
	if response := request(t, router, http.MethodPost, "/api/v1/auth/login", map[string]string{"password": "wrong-password"}, nil); response.Code != http.StatusTooManyRequests {
		t.Fatalf("rate limit: got %d", response.Code)
	}

	secondRouter, secondDatabase := testRouter(t)
	defer secondDatabase.Close()
	login := request(t, secondRouter, http.MethodPost, "/api/v1/auth/login", map[string]string{"password": "a-secure-password"}, nil)
	var loginPayload apiResponse
	decode(t, login.Body.Bytes(), &loginPayload)
	var session struct {
		CSRFToken string `json:"csrfToken"`
	}
	decode(t, loginPayload.Data, &session)
	cookie := login.Result().Cookies()[0]
	if response := execute(t, secondRouter, http.MethodPost, "/api/v1/auth/logout-all", nil, cookie, session.CSRFToken); response.Code != http.StatusOK {
		t.Fatalf("logout all: got %d", response.Code)
	}
	if response := request(t, secondRouter, http.MethodGet, "/api/v1/auth/session", nil, cookie); response.Code != http.StatusUnauthorized {
		t.Fatalf("session after logout all: got %d", response.Code)
	}
}

func testRouter(t *testing.T) (*httpapi.Router, *sql.DB) {
	t.Helper()
	databasePath := filepath.Join(t.TempDir(), "blog.sqlite")
	databaseConnection, err := database.Open(databasePath)
	if err != nil {
		t.Fatal(err)
	}
	if err := database.Migrate(databaseConnection); err != nil {
		databaseConnection.Close()
		t.Fatal(err)
	}
	return httpapi.NewRouter(config.Config{DatabasePath: databasePath, AdminPassword: "a-secure-password", SessionDays: 1}, databaseConnection), databaseConnection
}

func request(t *testing.T, router http.Handler, method, path string, payload interface{}, cookie *http.Cookie) *httptest.ResponseRecorder {
	return execute(t, router, method, path, payload, cookie, "")
}
func execute(t *testing.T, router http.Handler, method, path string, payload interface{}, cookie *http.Cookie, csrf string) *httptest.ResponseRecorder {
	t.Helper()
	var body bytes.Buffer
	if payload != nil {
		if err := json.NewEncoder(&body).Encode(payload); err != nil {
			t.Fatal(err)
		}
	}
	request := httptest.NewRequest(method, path, &body)
	request.Header.Set("Content-Type", "application/json")
	if cookie != nil {
		request.AddCookie(cookie)
	}
	if csrf != "" {
		request.Header.Set("X-CSRF-Token", csrf)
	}
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
}
func decode(t *testing.T, source []byte, target interface{}) {
	t.Helper()
	if err := json.Unmarshal(source, target); err != nil {
		t.Fatalf("decode response: %v; source: %s", err, source)
	}
}
