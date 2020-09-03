from http.server import HTTPServer, SimpleHTTPRequestHandler
import ssl

separator = "-" * 80
port = 7000
httpd = HTTPServer(("", port), SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket(httpd.socket, certfile="./server.pem", server_side=True)

print(separator)
print("Server running on https://localhost:" + str(port))
print(separator)

httpd.serve_forever()