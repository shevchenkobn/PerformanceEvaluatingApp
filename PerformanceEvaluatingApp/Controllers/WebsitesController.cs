using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Description;
using PerformanceEvaluatingApp.Models;

namespace PerformanceEvaluatingApp.Controllers
{
    public class WebsitesController : ApiController
    {
        private WebsitesContext db = new WebsitesContext();

        // GET: api/Websites
        public IQueryable<Website> GetWebsites()
        {
            return db.Websites;
        }

        // GET: api/Websites/5
        [ResponseType(typeof(Website))]
        public async Task<IHttpActionResult> GetWebsite(int id)
        {
            Website website = await db.Websites.FindAsync(id);
            if (website == null)
            {
                return NotFound();
            }

            return Ok(website);
        }

        // PUT: api/Websites/5
        [ResponseType(typeof(void))]
        public async Task<IHttpActionResult> PutWebsite(int id, Website website)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != website.Id)
            {
                return BadRequest();
            }

            db.Entry(website).State = EntityState.Modified;

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WebsiteExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return StatusCode(HttpStatusCode.NoContent);
        }

        // POST: api/Websites
        [ResponseType(typeof(Website))]
        public async Task<IHttpActionResult> PostWebsite(Website website)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            db.Websites.Add(website);
            await db.SaveChangesAsync();

            return CreatedAtRoute("DefaultApi", new { id = website.Id }, website);
        }

        // DELETE: api/Websites/5
        [ResponseType(typeof(Website))]
        public async Task<IHttpActionResult> DeleteWebsite(int id)
        {
            Website website = await db.Websites.FindAsync(id);
            if (website == null)
            {
                return NotFound();
            }

            db.Websites.Remove(website);
            await db.SaveChangesAsync();

            return Ok(website);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }

        private bool WebsiteExists(int id)
        {
            return db.Websites.Count(e => e.Id == id) > 0;
        }
    }
}