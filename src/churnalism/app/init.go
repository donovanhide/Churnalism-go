package app

import (
	"code.google.com/p/go.exp/utf8string"
	"github.com/robfig/revel"
	"html/template"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"
)

func init() {
	// Filters is the default set of global filters.
	revel.Filters = []revel.Filter{
		revel.PanicFilter,             // Recover from panics and display an error page instead.
		revel.RouterFilter,            // Use the routing table to select the right Action
		revel.FilterConfiguringFilter, // A hook for adding or removing per-Action filters.
		revel.ParamsFilter,            // Parse parameters into Controller.Params.
		revel.SessionFilter,           // Restore and write the session cookie.
		revel.FlashFilter,             // Restore and write the flash cookie.
		revel.ValidationFilter,        // Restore kept validation errors and save new ones from cookie.
		revel.I18nFilter,              // Resolve the requested language
		revel.InterceptorFilter,       // Run interceptors around the action.
		revel.ActionInvoker,           // Invoke the action.
	}

	revel.TemplateFuncs["year"] = func() template.HTML {
		return template.HTML(time.Now().Format("2006"))
	}

	revel.TemplateFuncs["truncatewords"] = func(s string, words int) template.HTML {
		truncated := strings.SplitN(s, " ", words+1)
		truncated[words] = "..."
		return template.HTML(strings.Join(truncated, " "))
	}

	revel.TemplateFuncs["truncatechars"] = func(s string, chars int) template.HTML {
		switch {
		case utf8.RuneCountInString(s) <= chars:
			return template.HTML(s)
		case unicode.IsSpace(utf8string.NewString(s).At(chars)):
			return template.HTML(strings.TrimRightFunc(s[:chars], unicode.IsSpace) + "...")
		default:
			pos := strings.LastIndexFunc(s[:chars], unicode.IsSpace)
			if pos > 0 {
				return template.HTML(s[:pos] + "...")
			}
			return template.HTML(s[:chars] + "...")
		}
	}
}
