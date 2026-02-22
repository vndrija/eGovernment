# Build Stage
FROM golang:1.23-alpine AS builder
WORKDIR /app

# Copy dependency files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o trafficpolice main.go

# Run Stage
FROM alpine:latest
WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/trafficpolice .

# Expose the internal port
EXPOSE 8080

# Command to run
CMD ["./trafficpolice"]
