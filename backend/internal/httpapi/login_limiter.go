package httpapi

import (
	"net"
	"net/http"
	"sync"
	"time"
)

type loginAttempt struct {
	failures int
	resetAt  time.Time
}
type loginLimiter struct {
	mutex    sync.Mutex
	attempts map[string]loginAttempt
}

func newLoginLimiter() *loginLimiter { return &loginLimiter{attempts: map[string]loginAttempt{}} }
func (limiter *loginLimiter) allow(request *http.Request) (bool, time.Duration) {
	limiter.mutex.Lock()
	defer limiter.mutex.Unlock()
	key := clientAddress(request)
	if key == "127.0.0.1" || key == "::1" || key == "localhost" {
		return true, 0
	}
	attempt, ok := limiter.attempts[key]
	if !ok || time.Now().After(attempt.resetAt) {
		delete(limiter.attempts, key)
		return true, 0
	}
	if attempt.failures < 5 {
		return true, 0
	}
	return false, time.Until(attempt.resetAt)
}
func (limiter *loginLimiter) failure(request *http.Request) {
	limiter.mutex.Lock()
	defer limiter.mutex.Unlock()
	key, now := clientAddress(request), time.Now()
	attempt := limiter.attempts[key]
	if now.After(attempt.resetAt) {
		attempt = loginAttempt{resetAt: now.Add(15 * time.Minute)}
	}
	attempt.failures++
	limiter.attempts[key] = attempt
}
func (limiter *loginLimiter) success(request *http.Request) {
	limiter.mutex.Lock()
	delete(limiter.attempts, clientAddress(request))
	limiter.mutex.Unlock()
}
func clientAddress(request *http.Request) string {
	host, _, err := net.SplitHostPort(request.RemoteAddr)
	if err == nil {
		return host
	}
	return request.RemoteAddr
}
