package models

import (
	"encoding/json"
	"github.com/robfig/revel"
	"net/http"
	"time"
)

type Article struct {
	Id, Title, Scraper, Source, Url, Text string
	Published                             time.Time
}

func (art Article) Apply(req *revel.Request, resp *revel.Response) {
	resp.WriteHeader(http.StatusOK, "application/json")
	json.NewEncoder(resp.Out).Encode(art)
}

type Stats struct {
	HighScores []Article
	MostViewed []Article
	MostShared []Article
}
