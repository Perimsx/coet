package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/kerntau/blog/cms-api/internal/app"
	"github.com/kerntau/blog/cms-api/internal/config"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	// 初始化 Zerolog 输出格式
	log.Logger = log.Output(zerolog.ConsoleWriter{
		Out:        os.Stdout,
		TimeFormat: "2006-01-02 15:04:05",
	})

	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to load configuration")
	}

	application, err := app.New(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to initialize application")
	}
	defer application.Close()

	e := application.Router().Echo()

	go func() {
		log.Info().Str("addr", cfg.ListenAddress).Msg("Xuzhan CMS API (Echo v4) started")
		if err := e.Start(cfg.ListenAddress); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("Echo server failure")
		}
	}()

	signalChannel := make(chan os.Signal, 1)
	signal.Notify(signalChannel, syscall.SIGINT, syscall.SIGTERM)
	<-signalChannel

	log.Info().Msg("shutting down server gracefully...")
	shutdownContext, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := e.Shutdown(shutdownContext); err != nil {
		log.Error().Err(err).Msg("server shutdown failed")
	} else {
		log.Info().Msg("server exited cleanly")
	}
}
