package tests

import (
	"github.com/robfig/revel"
	"net/url"
)

type AppTest struct {
	revel.TestSuite
}

func (t AppTest) Before() {
	println("Set up")
}

func (t AppTest) TestThatIndexPageWorks() {
	t.Get("/")
	t.AssertOk()
	t.AssertContentType("text/html")
}

func (t AppTest) TestThatSearchWorks() {
	t.PostForm("/search/", url.Values{"article.Text": {"A Betfair sponsored race. The betting exchange has seen seven key employees"}})
	t.AssertOk()
	t.AssertContentType("application/json")
	t.AssertContains(`"documents":`)
}

func (t AppTest) After() {
	println("Tear down")
}
