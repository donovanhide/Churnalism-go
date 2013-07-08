package controllers

import (
	"time"
)

type PressRelease struct {
	Id, Title, Scraper, Url, Text string
	Published                     time.Time
}

type Stats struct {
	HighScores []PressRelease
	MostViewed []PressRelease
	MostShared []PressRelease
}
