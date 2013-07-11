package controllers

import (
	"time"
)

type Article struct {
	Id, Title, Scraper, Url, Text string
	Published                     time.Time
}

type Stats struct {
	HighScores []Article
	MostViewed []Article
	MostShared []Article
}
