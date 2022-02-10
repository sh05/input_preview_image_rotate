package main

import (
	"html/template"
	"io"
	"net/http"
	"os"
    "time"
    "strconv"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type Template struct {
  templates *template.Template
}

func (t *Template) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
  return t.templates.ExecuteTemplate(w, name, data)
}

func main() {
  e := echo.New()
  e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
    Format: "method=${method}, uri=${uri}, status=${status}, ${form:name}, ${form:image}\n",
  }))
  e.Static("/static", "static")
  e.File("/top", "public/index.html")

  t := &Template{
    templates: template.Must(template.ParseGlob("public/views/*.html")),
  }

  e.Renderer = t

  e.GET("/", func(c echo.Context) error {
    return c.String(http.StatusOK, "Hello, World")
  })
  e.GET("/hello", Hello)
  e.POST("/image", saveImage)

  e.Logger.Fatal(e.Start(":9090"))
}

func Hello(c echo.Context) error {
  return c.Render(http.StatusOK, "hello", "d")
}

func saveImage(c echo.Context) error {
  name := c.FormValue("name")
  image, err := c.FormFile("image")
  if err != nil {
    return err
  }

  // Source
  src, err := image.Open()
  if err != nil {
    return err
  }
  defer src.Close()

  // Destination
  imageSavePath := "static/image/" + strconv.Itoa(time.Now().Nanosecond()) + image.Filename 
  dst, err := os.Create(imageSavePath)
  if err != nil {
    return err
  }
  defer dst.Close()

  // Copy
  if _, err = io.Copy(dst, src); err != nil {
    return err
  }

  return c.HTML(http.StatusOK, "<b>Thank you! " + name + "</b><img src=" + imageSavePath + ">")
}
