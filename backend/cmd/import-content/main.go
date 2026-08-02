package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"path/filepath"

	"github.com/kerntau/blog/cms-api/internal/contentimport"
	"github.com/kerntau/blog/cms-api/internal/database"
)

func main() {
	databasePath := flag.String("database", "../storage/db/blog.sqlite", "SQLite database path")
	contentDirectory := flag.String("content", "../content/blog", "Markdown content directory")
	friendsFile := flag.String("friends", "../content/friends.json", "friend links JSON file")
	siteTitle := flag.String("site-title", "序栈", "initial site title")
	siteDescription := flag.String("site-description", "在有序的世界里，寻一处生活的归栈。", "initial site description")
	siteURL := flag.String("site-url", "https://blog.cot.wiki", "initial site URL")
	author := flag.String("author", "Kerntau", "initial site author")
	flag.Parse()
	databaseConnection, err := database.Open(filepath.Clean(*databasePath))
	if err != nil {
		log.Fatal(err)
	}
	defer databaseConnection.Close()
	if err := database.Migrate(databaseConnection); err != nil {
		log.Fatal(err)
	}
	result, err := contentimport.Run(context.Background(), databaseConnection, contentimport.Options{ContentDirectory: filepath.Clean(*contentDirectory), FriendsFile: filepath.Clean(*friendsFile), SiteTitle: *siteTitle, SiteDescription: *siteDescription, SiteURL: *siteURL, Author: *author})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Imported %d posts, %d categories, %d tags, %d friends; skipped %d existing or invalid files.\n", result.Posts, result.Categories, result.Tags, result.Friends, result.Skipped)
}
