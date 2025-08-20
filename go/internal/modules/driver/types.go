package driver

// CreateRequest is the JSON request for Create
type CreateRequest struct {
	Name string
}

type GetRequest struct {
	Name string
}

// RemoveRequest is the JSON request for Remove
type RemoveRequest struct {
	Name string
}

// MountRequest is the JSON request for Mount
type MountRequest struct {
	Name string
	ID   string
}

// PathRequest is the JSON request for Path
type PathRequest struct {
	Name string
}
