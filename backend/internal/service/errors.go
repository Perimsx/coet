package service

import "errors"

var (
	ErrNotFound       = errors.New("resource not found")
	ErrConflict       = errors.New("resource conflict")
	ErrInvalidInput   = errors.New("invalid input")
	ErrInvalidSession = errors.New("invalid session")
)
