package core

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"reflect"
	"strings"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

type FieldError struct {
	Field   string `json:"field"`
	Tag     string `json:"tag"`
	Param   string `json:"param,omitempty"`
	Message string `json:"message"`
}

type ValidationError struct {
	Errors []FieldError `json:"errors"`
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("validation failed (%d errors)", len(e.Errors))
}

// DecodeStrict decodes a JSON object from raw, rejects unknown fields, and
// validates struct tags (binding:"..."). Returns a ValidationError for
// semantic issues so callers can map it to HTTP 422.
func DecodeStrict[T any](raw json.RawMessage) (T, error) {
	var out T

	trimmed := bytes.TrimSpace(raw)
	if len(trimmed) == 0 || bytes.Equal(trimmed, []byte("null")) {
		return out, &ValidationError{
			Errors: []FieldError{{
				Field:   "",
				Tag:     "required",
				Message: "config is required",
			}},
		}
	}
	if trimmed[0] != '{' {
		return out, fmt.Errorf("config must be a JSON object")
	}

	dec := json.NewDecoder(bytes.NewReader(raw))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&out); err != nil {
		return out, fmt.Errorf("invalid JSON: %w", err)
	}
	// Ensure no trailing junk after the object
	if err := dec.Decode(&struct{}{}); err != io.EOF {
		if err == nil {
			return out, errors.New("unexpected trailing data after JSON object")
		}
		return out, fmt.Errorf("invalid JSON: %w", err)
	}

	if binding.Validator == nil {
		return out, errors.New("validator not initialized")
	}
	if err := binding.Validator.ValidateStruct(out); err != nil {
		if verrs, ok := err.(validator.ValidationErrors); ok {
			return out, toValidationError[T](verrs)
		}
		return out, err
	}

	return out, nil
}

func toValidationError[T any](verrs validator.ValidationErrors) *ValidationError {
	errs := make([]FieldError, 0, len(verrs))
	t := reflect.TypeOf((*T)(nil)).Elem()
	if t.Kind() == reflect.Pointer {
		t = t.Elem()
	}

	for _, fe := range verrs {
		name := fe.Field()
		if t.Kind() == reflect.Struct {
			if sf, ok := t.FieldByName(fe.StructField()); ok {
				if tag := sf.Tag.Get("json"); tag != "" && tag != "-" {
					name = strings.Split(tag, ",")[0]
				} else {
					// fallback to lower-camel for nicer output
					name = lowerCamel(name)
				}
			}
		}
		errs = append(errs, FieldError{
			Field:   name,
			Tag:     fe.Tag(),
			Param:   fe.Param(),
			Message: defaultMsg(fe),
		})
	}
	return &ValidationError{Errors: errs}
}

func defaultMsg(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return ""
	case "min":
		return fmt.Sprintf("must be at least %s", fe.Param())
	case "max":
		return fmt.Sprintf("must be at most %s", fe.Param())
	case "oneof":
		return "must be one of: " + fe.Param()
	case "hostname", "ip":
		return "must be a valid " + fe.Tag()
	}
	return fe.Error()
}

func lowerCamel(s string) string {
	if s == "" {
		return s
	}
	r := []rune(s)
	r[0] = []rune(strings.ToLower(string(r[0])))[0]
	return string(r)
}
