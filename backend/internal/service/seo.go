package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/kerntau/blog/cms-api/internal/config"
)

type SEOSettings struct {
	Title                string `json:"title"`
	Description          string `json:"description"`
	Keywords             string `json:"keywords"`
	CanonicalURL         string `json:"canonicalUrl"`
	OpenGraphImageURL    string `json:"openGraphImageUrl"`
	RobotsEnabled        bool   `json:"robotsEnabled"`
	SitemapEnabled       bool   `json:"sitemapEnabled"`
	RSSEnabled           bool   `json:"rssEnabled"`
	JSONLDEnabled        bool   `json:"jsonLdEnabled"`
	RevalidateConfigured bool   `json:"revalidateConfigured"`
	IndexNowConfigured   bool   `json:"indexNowConfigured"`
	BaiduConfigured      bool   `json:"baiduConfigured"`
}

type SEOInput struct {
	Title             string `json:"title"`
	Description       string `json:"description"`
	Keywords          string `json:"keywords"`
	CanonicalURL      string `json:"canonicalUrl"`
	OpenGraphImageURL string `json:"openGraphImageUrl"`
	RobotsEnabled     bool   `json:"robotsEnabled"`
	SitemapEnabled    bool   `json:"sitemapEnabled"`
	RSSEnabled        bool   `json:"rssEnabled"`
	JSONLDEnabled     bool   `json:"jsonLdEnabled"`
}

type SEOCredentialsInput struct {
	IndexNowKey *string `json:"indexNowKey"`
	BaiduToken  *string `json:"baiduToken"`
}

type SEOService struct {
	site   *SiteService
	posts  *PostService
	cfg    config.Config
	client *http.Client
}

func NewSEOService(site *SiteService, posts *PostService, cfg config.Config) *SEOService {
	return &SEOService{site: site, posts: posts, cfg: cfg, client: &http.Client{Timeout: 10 * time.Second}}
}

func (service *SEOService) Get(ctx context.Context) (SEOSettings, error) {
	values, err := service.site.GetSettings(ctx)
	if err != nil {
		return SEOSettings{}, err
	}

	indexNowKey, _ := service.site.GetSetting(ctx, "CMS_INDEXNOW_KEY")
	if indexNowKey == "" {
		indexNowKey = service.cfg.IndexNowKey
	}
	baiduToken, _ := service.site.GetSetting(ctx, "CMS_BAIDU_PUSH_TOKEN")
	if baiduToken == "" {
		baiduToken = service.cfg.BaiduPushToken
	}

	return SEOSettings{
		Title: values["seo.title"], Description: values["seo.description"], Keywords: values["seo.keywords"], CanonicalURL: values["seo.canonical_url"], OpenGraphImageURL: values["seo.open_graph_image_url"],
		RobotsEnabled: settingBool(values, "seo.robots_enabled", true), SitemapEnabled: settingBool(values, "seo.sitemap_enabled", true), RSSEnabled: settingBool(values, "seo.rss_enabled", true), JSONLDEnabled: settingBool(values, "seo.json_ld_enabled", true),
		RevalidateConfigured: service.cfg.NextRevalidateURL != "" && service.cfg.NextRevalidateSecret != "",
		IndexNowConfigured:   strings.TrimSpace(indexNowKey) != "",
		BaiduConfigured:      strings.TrimSpace(baiduToken) != "",
	}, nil
}

func (service *SEOService) Update(ctx context.Context, input SEOInput) (SEOSettings, error) {
	if len(strings.TrimSpace(input.Title)) > 70 || len(strings.TrimSpace(input.Description)) > 300 || len(strings.TrimSpace(input.Keywords)) > 500 || !optionalExternalURL(input.CanonicalURL) || !optionalExternalURL(input.OpenGraphImageURL) {
		return SEOSettings{}, ErrInvalidInput
	}
	_, err := service.site.UpdateSettings(ctx, map[string]string{
		"seo.title": strings.TrimSpace(input.Title), "seo.description": strings.TrimSpace(input.Description), "seo.keywords": strings.TrimSpace(input.Keywords), "seo.canonical_url": strings.TrimSpace(input.CanonicalURL), "seo.open_graph_image_url": strings.TrimSpace(input.OpenGraphImageURL),
		"seo.robots_enabled": fmt.Sprint(input.RobotsEnabled), "seo.sitemap_enabled": fmt.Sprint(input.SitemapEnabled), "seo.rss_enabled": fmt.Sprint(input.RSSEnabled), "seo.json_ld_enabled": fmt.Sprint(input.JSONLDEnabled),
	})
	if err != nil {
		return SEOSettings{}, err
	}
	return service.Get(ctx)
}

func (service *SEOService) UpdateCredentials(ctx context.Context, input SEOCredentialsInput) (SEOSettings, error) {
	if input.IndexNowKey != nil {
		value := strings.TrimSpace(*input.IndexNowKey)
		if len(value) > 512 || strings.ContainsAny(value, "\r\n") {
			return SEOSettings{}, ErrInvalidInput
		}
		if err := service.site.SetSetting(ctx, "CMS_INDEXNOW_KEY", value); err != nil {
			return SEOSettings{}, err
		}
	}
	if input.BaiduToken != nil {
		value := strings.TrimSpace(*input.BaiduToken)
		if len(value) > 512 || strings.ContainsAny(value, "\r\n") {
			return SEOSettings{}, ErrInvalidInput
		}
		if err := service.site.SetSetting(ctx, "CMS_BAIDU_PUSH_TOKEN", value); err != nil {
			return SEOSettings{}, err
		}
	}
	return service.Get(ctx)
}

func (service *SEOService) Rebuild(ctx context.Context, report func(int, string)) error {
	if service.cfg.NextRevalidateURL == "" || service.cfg.NextRevalidateSecret == "" {
		return ErrInvalidInput
	}
	report(20, "正在请求 Next.js 刷新首页、内容索引和 Sitemap 缓存")
	return service.revalidate(ctx, []string{"/", "/blog", "/archive", "/tags", "/blog/category", "/friends", "/sitemap.xml", "/robots.txt"})
}

func (service *SEOService) Push(ctx context.Context, report func(int, string)) error {
	indexNowKey, _ := service.site.GetSetting(ctx, "CMS_INDEXNOW_KEY")
	if indexNowKey == "" {
		indexNowKey = service.cfg.IndexNowKey
	}
	baiduPushToken, _ := service.site.GetSetting(ctx, "CMS_BAIDU_PUSH_TOKEN")
	if baiduPushToken == "" {
		baiduPushToken = service.cfg.BaiduPushToken
	}

	if indexNowKey == "" && baiduPushToken == "" {
		return ErrInvalidInput
	}
	values, err := service.site.GetSettings(ctx)
	if err != nil {
		return err
	}
	siteURL := strings.TrimSuffix(strings.TrimSpace(values["site.url"]), "/")
	if siteURL == "" {
		siteURL = strings.TrimSuffix(strings.TrimSpace(values["siteUrl"]), "/")
	}
	parsed, err := url.ParseRequestURI(siteURL)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return ErrInvalidInput
	}
	posts, _, err := service.posts.List(ctx, PostFilters{Pagination: Pagination{Page: 1, PageSize: 100}, Status: "published"})
	if err != nil {
		return err
	}
	urls := []string{siteURL + "/", siteURL + "/blog", siteURL + "/sitemap.xml"}
	for _, post := range posts {
		urls = append(urls, siteURL+"/blog/"+post.Slug)
	}
	report(25, fmt.Sprintf("已收集 %d 个已发布 URL", len(urls)))
	if indexNowKey != "" {
		report(45, "正在提交 IndexNow")
		payload, _ := json.Marshal(map[string]interface{}{"host": parsed.Host, "key": indexNowKey, "keyLocation": siteURL + "/" + indexNowKey + ".txt", "urlList": urls})
		if err := service.post(ctx, "https://api.indexnow.org/indexnow", "application/json", payload); err != nil {
			return fmt.Errorf("IndexNow push: %w", err)
		}
	}
	if baiduPushToken != "" {
		report(70, "正在提交百度主动推送")
		endpoint := "http://data.zz.baidu.com/urls?site=" + url.QueryEscape(siteURL) + "&token=" + url.QueryEscape(baiduPushToken)
		if err := service.post(ctx, endpoint, "text/plain", []byte(strings.Join(urls, "\n"))); err != nil {
			return fmt.Errorf("Baidu push: %w", err)
		}
	}
	report(90, "搜索引擎推送已完成")
	return nil
}

func (service *SEOService) revalidate(ctx context.Context, paths []string) error {
	body, err := json.Marshal(map[string][]string{"paths": paths})
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, service.cfg.NextRevalidateURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-CMS-Revalidate-Secret", service.cfg.NextRevalidateSecret)
	return service.request(req)
}

func (service *SEOService) post(ctx context.Context, endpoint, contentType string, body []byte) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", contentType)
	return service.request(req)
}

func (service *SEOService) request(request *http.Request) error {
	response, err := service.client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode >= http.StatusOK && response.StatusCode < http.StatusMultipleChoices {
		return nil
	}
	body, _ := io.ReadAll(io.LimitReader(response.Body, 1024))
	return fmt.Errorf("unexpected HTTP status %d: %s", response.StatusCode, strings.TrimSpace(string(body)))
}

func settingBool(values map[string]string, key string, fallback bool) bool {
	if value, ok := values[key]; ok {
		return strings.EqualFold(value, "true")
	}
	return fallback
}
func optionalExternalURL(value string) bool {
	if strings.TrimSpace(value) == "" {
		return true
	}
	parsed, err := url.ParseRequestURI(strings.TrimSpace(value))
	return err == nil && (parsed.Scheme == "https" || parsed.Scheme == "http") && parsed.Host != ""
}
