using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;

namespace PerformanceEvaluatingApp.Models
{
    public class DbInitializer : DropCreateDatabaseIfModelChanges<WebsitesContext>
    {
        protected override void Seed(WebsitesContext context)
        {
            var codes = new List<HttpStatusCode>
            {
                new HttpStatusCode(100, "Continue"),
                new HttpStatusCode(101, "Switching Protocols"),
                new HttpStatusCode(102, "Processing"),

                new HttpStatusCode(200, "OK"),
                new HttpStatusCode(201, "Created"),
                new HttpStatusCode(202, "Accepted"),
                new HttpStatusCode(204, "No Content"),
                new HttpStatusCode(205, "Reset Content"),
                new HttpStatusCode(206, "Partial Content"),
                new HttpStatusCode(207, "Multi-Status"),
                new HttpStatusCode(208, "Already Reported"),
                new HttpStatusCode(226, "IM Used"),

                new HttpStatusCode(300, "Multiple Choices"),
                new HttpStatusCode(301, "Moved Permanently"),
                new HttpStatusCode(302, "Found"),
                new HttpStatusCode(303, "See Other"),
                new HttpStatusCode(304, "Not Modified"),
                new HttpStatusCode(305, "Use Proxy"),
                new HttpStatusCode(306, "Switch Proxy"),
                new HttpStatusCode(307, "Temporary Redirect"),
                new HttpStatusCode(308, "Permanent Redirect"),

                new HttpStatusCode(400, "Bad Request"),
                new HttpStatusCode(401, "Unauthorized"),
                new HttpStatusCode(402, "Payment Required"),
                new HttpStatusCode(403, "Forbidden"),
                new HttpStatusCode(404, "Not Found"),
                new HttpStatusCode(405, "Method Not Allowed"),
                new HttpStatusCode(406, "Not Acceptable"),
                new HttpStatusCode(407, "Proxy Authentification Required"),
                new HttpStatusCode(408, "Request Timeout"),
                new HttpStatusCode(409, "Conflict"),
                new HttpStatusCode(410, "Gone"),
                new HttpStatusCode(411, "Length Required"),
                new HttpStatusCode(412, "Precondition Failed"),
                new HttpStatusCode(413, "Payload Too Large"),
                new HttpStatusCode(414, "URI Too Long"),
                new HttpStatusCode(415, "Unsupported Media Type"),
                new HttpStatusCode(416, "Range Not Satisfiable"),
                new HttpStatusCode(417, "Expectation Failed"),
                new HttpStatusCode(418, "I'm a teapot"),
                new HttpStatusCode(421, "Misdirected Request"),
                new HttpStatusCode(422, "Unprocessable Entity"),
                new HttpStatusCode(423, "Locked"),
                new HttpStatusCode(424, "Upgrade Required"),
                new HttpStatusCode(428, "Precondition Required"),
                new HttpStatusCode(429, "Too Many Requests"),
                new HttpStatusCode(431, "Request Header Fields Too Large"),
                new HttpStatusCode(451, "Unavailable For Legal Reasons"),

                new HttpStatusCode(500, "Internal Server Error"),
                new HttpStatusCode(501, "Not Implemented"),
                new HttpStatusCode(502, "Bad Gateway"),
                new HttpStatusCode(503, "Service Unavailable"),
                new HttpStatusCode(504, "Gateway Timeout"),
                new HttpStatusCode(505, "HTTP Version Not Supproted"),
                new HttpStatusCode(506, "Variant Also Negotiates"),
                new HttpStatusCode(507, "Insufficient Storage"),
                new HttpStatusCode(508, "Loop Detected"),
                new HttpStatusCode(510, "Not Extended"),
                new HttpStatusCode(511, "Network Authentification Required"),
                // Not standart
                new HttpStatusCode(103, "Checkpoint"),
                new HttpStatusCode(103, "Early Hints"),
                new HttpStatusCode(420, "Method Failure (Spring Framework)"),
                new HttpStatusCode(420, "Enhance Your Calm (Twitter)"),
                new HttpStatusCode(450, "Blocked by Windows Parental Controls (Microsoft)"),
                new HttpStatusCode(498, "Invalid Token (Esri)"),
                new HttpStatusCode(499, "Token Required (Esri)"),
                new HttpStatusCode(530, "Site is frozen (Pantheon)"),
                new HttpStatusCode(598, "(Informal convention) Network read timeout error"),
                // IIS
                new HttpStatusCode(440, "Login Time-out (Internet Information Services)"),
                new HttpStatusCode(449, "Retry With (Internet Information Services)"),
                new HttpStatusCode(451, "Redirect (Internet Information Services)"),
                // nginx
                new HttpStatusCode(444, "No Response (nginx)"),
                new HttpStatusCode(495, "SSL Certificate Error (nginx)"),
                new HttpStatusCode(496, "SSL Certificate Required (nginx)"),
                new HttpStatusCode(497, "HTTP Request Sent to HTTPS Port (nginx)"),
                new HttpStatusCode(499, "Client Closed Request (nginx)"),
                // Cloudflare
                new HttpStatusCode(520, "Unknown Error (Cloudflare)"),
                new HttpStatusCode(521, "Web Server Is Down (Cloudflare)"),
                new HttpStatusCode(522, "Connection Timed Out (Cloudflare)"),
                new HttpStatusCode(523, "Origin Is Unreachable (Cloudflare)"),
                new HttpStatusCode(524, "A Timeout Occured (Cloudflare)"),
                new HttpStatusCode(525, "SSL Handshake Failed (Cloudflare)"),
                new HttpStatusCode(526, "Invalid SSL Certificate (Cloudflare)"),
                new HttpStatusCode(527, "Railgun Error (Cloudflare)")
            };
            context.HttpStatusCodes.AddRange(codes);
        }
    }
}