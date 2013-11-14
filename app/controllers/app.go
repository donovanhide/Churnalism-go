package controllers

import (
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
		resp, err := http.Get(apiAddress() + "/document/1/")
		if err != nil {
			revel.INFO.Fatalf("Can't get user documents docid from superfastmatch instance: %s", err)
		}
		var values map[string]int
		json.NewDecoder(resp.Body).Decode(&values)
		cache.Set("docid", values["totalRows"]+1, cache.FOREVER)
	})
}

func apiAddress() string {
	return revel.Config.StringDefault("churnalism.apiaddress", "http://sfm.churnalism.com")
}

func searchRange() string {
	return revel.Config.StringDefault("churnalism.searchrange", "2-2000")
}

func readabilityToken() string {
	return revel.Config.StringDefault("churnalism.readabilitytoken", "")
}

type App struct {
	*revel.Controller
}

func (c App) Index() revel.Result {
	if c.Request.URL.Path != "/" {
		return c.Redirect("/")
	}
	return c.RenderTemplate("App/Result.html")
}

func (c App) Result(doctype, docid uint32) revel.Result {
	url := fmt.Sprintf("%s/document/%d/%d/", apiAddress(), doctype, docid)
	resp, err := http.Get(url)
	if err != nil {
		return c.RenderError(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return c.Redirect(App.Index)
	}
	var document map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&document); err != nil {
		return c.RenderError(err)
	}
	c.RenderArgs["Document"] = document
	return c.RenderTemplate("App/Result.html")
}

func (c App) Suggest() revel.Result {
	return Stub(terms)
}

func (c App) Association(doctype, docid uint32) revel.Result {
	if doctype != 1 {
		return c.RenderError(fmt.Errorf("Doctype: %d not allowed", doctype))
	}
	url := fmt.Sprintf("%s/association/1/%d/%s/", apiAddress(), docid, searchRange())
	return newProxyPost(url, &c.Request.Form)
}

func (c App) Document() revel.Result {
	docid, err := cache.Increment("docid", 1)
	if err != nil {
		return c.RenderError(err)
	}
	url := fmt.Sprintf("%s/document/1/%d/", apiAddress(), docid)
	return newProxyPost(url, &c.Request.Form)
}

func (c App) Search(text string) revel.Result {
	values := url.Values{"text": {text}}
	url := fmt.Sprintf("%s/search/%s/", apiAddress(), searchRange())
	return newProxyPost(url, &values)
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

func (c App) Slurp() revel.Result {
	url := fmt.Sprintf("https://readability.com/api/content/v1/parser?url=%s&token=%s", c.Request.FormValue("url"), readabilityToken())
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return c.RenderError(err)
	}
	return &PassThrough{req}
}

type PassThrough struct {
	*http.Request
}

func newProxyPost(url string, values *url.Values) *PassThrough {
	req, _ := http.NewRequest("POST", url, strings.NewReader(values.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	return &PassThrough{req}
}

func (r *PassThrough) Apply(req *revel.Request, resp *revel.Response) {
	proxyResponse, err := http.DefaultClient.Do(r.Request)
	if err != nil {
		resp.WriteHeader(500, "text/plain")
		resp.Out.Write([]byte(err.Error()))
	}
	defer proxyResponse.Body.Close()
	resp.WriteHeader(proxyResponse.StatusCode, proxyResponse.Header.Get("Content-Type"))
	io.Copy(resp.Out, proxyResponse.Body)
}
