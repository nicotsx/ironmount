FROM golang:1.24-alpine3.21 AS builder

WORKDIR /ironmount

COPY go.mod ./

RUN go mod download

COPY . .

ARG TARGETOS=linux
ARG TARGETARCH
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
  go build -o /out/ironmount .

FROM alpine:3.22 AS runner
WORKDIR /
COPY --from=builder /out/ironmount /ironmount

ENTRYPOINT ["/ironmount"]
