using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;
using Newtonsoft.Json;

namespace PerformanceEvaluatingApp.Models
{
    /// <summary>
    /// Class is needed just to get 20 columns in database
    /// </summary>
    public class HttpStatusCode
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int Code { get; set; }
        public string Phrase { get; set; }
        [JsonIgnore]
        public virtual ICollection<WebPage> WebPages { get; set; }

        public HttpStatusCode()
        {
            WebPages = new List<WebPage>();
        }

        public HttpStatusCode(int code, string phrase)
        {
            Code = code;
            Phrase = phrase;
        }
    }
}