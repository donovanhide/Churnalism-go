package controllers

import (
	"churnalism/app/models"
	"encoding/json"
	"fmt"
	"github.com/robfig/revel"
	"github.com/robfig/revel/cache"
	"io"
	"net/http"
	"net/url"
	"strings"
)

func init() {
	revel.OnAppStart(func() {
		req, err := http.Get(apiAddress() + "/document/1/")
		if err != nil {
			revel.INFO.Fatalf("Can't get user documents docid from superfastmatch instance: %s", err)
		}
		var values map[string]int
		json.NewDecoder(req.Body).Decode(&values)
		cache.Set("docid", values["totalRows"]+1, cache.FOREVER)
	})
}

func apiAddress() string {
	return revel.Config.StringDefault("churnalism.apiaddress", "http://sfm.churnalism.com")
}

type App struct {
	*revel.Controller
}

func (c App) Index() revel.Result {
	c.RenderArgs["stats"] = stats
	c.RenderArgs["article"] = models.Article{}
	return c.RenderTemplate("App/Result.html")
}

func (c App) Result(id string) revel.Result {
	article := GetArticle(id)
	return c.Render(article, stats)
}

func (c App) Suggest() revel.Result {
	return Stub(terms)
}

func (c App) Save() revel.Result {
	if c.Request.Method == "GET" {
		return c.Redirect(App.Index)
	}
	docid, err := cache.Increment("docid", 1)
	if err != nil {
		return c.RenderError(err)
	}
	url := fmt.Sprintf("%s/document/1/%d/", apiAddress(), docid)
	req, _ := http.NewRequest("POST", url, strings.NewReader(c.Request.Form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	return &PassThrough{req}
}

func (c App) Search(text string) revel.Result {
	values := url.Values{"text": {text}}
	req, _ := http.NewRequest("POST", apiAddress()+"/search/", strings.NewReader(values.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	return &PassThrough{req}
}

func (c App) Api() revel.Result {
	return c.Render()
}

func (c App) Explore() revel.Result {
	return c.Render()
}

func (c App) Browse() revel.Result {
	return Stub(browse)
}

func (c App) Examples() revel.Result {
	return c.Render()
}

func (c App) Faq() revel.Result {
	return c.Render()
}

func (c App) Contact() revel.Result {
	return c.Render()
}

type PassThrough struct {
	*http.Request
}

func (r *PassThrough) Apply(req *revel.Request, resp *revel.Response) {
	proxyResponse, err := http.DefaultClient.Do(r.Request)
	if err != nil {
		resp.WriteHeader(500, "text/plain")
		resp.Out.Write([]byte(err.Error()))
	}
	resp.WriteHeader(proxyResponse.StatusCode, proxyResponse.Header.Get("Content-Type"))
	io.Copy(resp.Out, proxyResponse.Body)
}
