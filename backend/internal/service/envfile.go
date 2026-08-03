package service

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
)

var envAssignmentPattern = regexp.MustCompile(`^(\s*)(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)(\s*=).*$`)
var envFileMu sync.Mutex

func updateEnvFile(filePath string, values map[string]string) error {
	if strings.TrimSpace(filePath) == "" || len(values) == 0 {
		return fmt.Errorf("environment file path and values are required")
	}
	envFileMu.Lock()
	defer envFileMu.Unlock()

	filePath = filepath.Clean(filePath)
	content, err := os.ReadFile(filePath)
	if err != nil && !os.IsNotExist(err) {
		return err
	}

	lines := strings.Split(strings.ReplaceAll(string(content), "\r\n", "\n"), "\n")
	if len(lines) == 1 && lines[0] == "" {
		lines = nil
	}
	remaining := make(map[string]string, len(values))
	for key, value := range values {
		remaining[key] = quoteEnvValue(value)
	}

	for index, line := range lines {
		matches := envAssignmentPattern.FindStringSubmatch(line)
		if len(matches) != 4 {
			continue
		}
		key := matches[2]
		value, ok := remaining[key]
		if !ok {
			continue
		}
		lines[index] = matches[1] + key + matches[3] + value
		delete(remaining, key)
	}

	for key, value := range remaining {
		lines = append(lines, key+"="+value)
	}

	if err := os.MkdirAll(filepath.Dir(filePath), 0700); err != nil {
		return err
	}
	data := []byte(strings.TrimRight(strings.Join(lines, "\n"), "\n") + "\n")
	if err := os.WriteFile(filePath, data, 0600); err != nil {
		return err
	}
	return os.Chmod(filePath, 0600)
}

func quoteEnvValue(value string) string {
	value = strings.ReplaceAll(value, "\\", "\\\\")
	value = strings.ReplaceAll(value, "\"", "\\\"")
	value = strings.ReplaceAll(value, "\r", "")
	value = strings.ReplaceAll(value, "\n", "")
	return `"` + value + `"`
}
