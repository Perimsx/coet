package httpapi

import (
	"encoding/json"
	"net/http"
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

func writeJSON(w http.ResponseWriter, status int, requestID string, payload response) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("X-Request-ID", requestID)
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeSuccess(w http.ResponseWriter, requestID string, data interface{}) {
	writeJSON(w, http.StatusOK, requestID, response{Code: 0, Message: "ok", Data: data, RequestID: requestID})
}

func writeCreated(w http.ResponseWriter, requestID string, data interface{}) {
	writeJSON(w, http.StatusCreated, requestID, response{Code: 0, Message: "ok", Data: data, RequestID: requestID})
}

func writeError(w http.ResponseWriter, status, code int, requestID, message string, details interface{}) {
	writeJSON(w, status, requestID, response{Code: code, Message: message, Details: details, RequestID: requestID})
}
