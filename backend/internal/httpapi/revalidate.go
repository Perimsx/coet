package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"
)

func (router *Router) revalidate(paths ...string) {
	if router.config.NextRevalidateURL == "" || router.config.NextRevalidateSecret == "" || len(paths) == 0 {
		return
	}
	unique := make([]string, 0, len(paths))
	seen := map[string]bool{}
	for _, path := range paths {
		if strings.HasPrefix(path, "/") && !seen[path] {
			seen[path] = true
			unique = append(unique, path)
		}
	}
	go func() {
		body, err := json.Marshal(map[string][]string{"paths": unique})
		if err != nil {
			return
		}
		context, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		request, err := http.NewRequestWithContext(context, http.MethodPost, router.config.NextRevalidateURL, bytes.NewReader(body))
		if err != nil {
			log.Printf("create revalidate request: %v", err)
			return
		}
		request.Header.Set("Content-Type", "application/json")
		request.Header.Set("X-CMS-Revalidate-Secret", router.config.NextRevalidateSecret)
		response, err := (&http.Client{Timeout: 6 * time.Second}).Do(request)
		if err != nil {
			log.Printf("revalidate Next paths: %v", err)
			return
		}
		defer response.Body.Close()
		if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
			log.Printf("revalidate Next paths: unexpected status %d", response.StatusCode)
		}
	}()
}
