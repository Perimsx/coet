package httpapi

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type response struct {
	Code      int         `json:"code"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
	Details   interface{} `json:"details,omitempty"`
	RequestID string      `json:"requestId"`
}

type pageResponse[T any] struct {
	Items    []T `json:"items"`
	Page     int `json:"page"`
	PageSize int `json:"pageSize"`
	Total    int `json:"total"`
}

func getContextRequestID(c echo.Context) string {
	if reqID, ok := c.Get("request_id").(string); ok && reqID != "" {
		return reqID
	}
	if reqID := c.Response().Header().Get("X-Request-ID"); reqID != "" {
		return reqID
	}
	return "req_unknown"
}

func writeJSON(c echo.Context, status int, payload response) error {
	requestID := getContextRequestID(c)
	payload.RequestID = requestID
	c.Response().Header().Set("X-Request-ID", requestID)
	return c.JSON(status, payload)
}

func writeSuccess(c echo.Context, data interface{}) error {
	return writeJSON(c, http.StatusOK, response{Code: 0, Message: "ok", Data: data})
}

func writeCreated(c echo.Context, data interface{}) error {
	return writeJSON(c, http.StatusCreated, response{Code: 0, Message: "ok", Data: data})
}

func writeError(c echo.Context, status, code int, message string, details interface{}) error {
	return writeJSON(c, status, response{Code: code, Message: message, Details: details})
}
