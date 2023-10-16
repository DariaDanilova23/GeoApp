using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using GeoAuth.Models;
using GeoAuth.Data;
using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Text;
using System.Security.Claims;
using Npgsql;
using System.Net.Http;
using System.Net.Http.Headers;

namespace GeoAuth.Controllers
{
    [Authorize]
    [Route("[controller]")]
    public class ShapeController : Controller
    {

        public ShapeController()
        {

        }

        [HttpGet("/Shape")]
        public IActionResult Index()
        {
            return View("Index");
        }

        public async Task createdWorkspace(string my_workspace)
        {
            try
            {
                string url = "http://localhost:8080/geoserver/rest/workspaces"; // ссылка для создания
                using var client = new HttpClient();
                var authString = Convert.ToBase64String(Encoding.UTF8.GetBytes("admin:geoserver")); //авторизация
                client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authString);
                var buffer = "<workspace><name>" + my_workspace + "</name></workspace>"; //именование рабочей области
                var httpContent = new StringContent(buffer, Encoding.UTF8, "application/xml");
                var response = await client.PostAsync(url, httpContent); //запрос
                var result = await response.Content.ReadAsStringAsync();
            }
            catch
            {

            }
        }


        private byte[] readLocalShapeFile(string filePath)
        {
            byte[] buffer;
            FileStream fStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
            Console.Write(fStream);
            try
            {
                int length = (int)fStream.Length;
                buffer = new byte[length];
                int count;
                int sum = 0;

                while ((count = fStream.Read(buffer, sum, length - sum)) > 0)
                    sum += count;
            }
            finally
            {
                fStream.Close();
            }
            return buffer;
        }

        public async Task AddRastor()//string filePath
        {
             string filePath = "C:/NDVI.tif";
             var fileName = Path.GetFileName(filePath);
            string datastore = fileName.Substring(0, fileName.Length - 4);
            using var client = new HttpClient();
            var authString = Convert.ToBase64String(Encoding.UTF8.GetBytes("admin:geoserver"));//авторизация
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authString);


            string sUrl = "http://localhost:8080/geoserver/rest/workspaces/rastergeo/coveragestores/"+datastore+"/file.geotiff";
            byte[] fileBytes = System.IO.File.ReadAllBytes(filePath);
            ByteArrayContent fileContent = new ByteArrayContent(fileBytes);

            fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/tiff");


            HttpResponseMessage response = client.PutAsync(sUrl, fileContent).Result;

            return;
        }
        public bool  AddVector(string filePath, string ds)
        {

            Uri zipFilePath = new Uri(filePath);
            string link = "";
            string storeName = "";
            var userId = User.FindFirst(ClaimTypes.NameIdentifier).Value; //определение id пользователя
            var userRole = User.FindFirst(ClaimTypes.Role).Value;//определение роли пользователя

            if (userRole == "User") //если пользователь в роли обычного пользователя
            {
                 createdWorkspace(userId); //вызов функции создания workspace с названием соответствующим id пользователя
                link = userId;
                storeName = ds;
            }
            else if (userRole == "Provider") //если пользователь в роли поставщик
            {
                link = "geoportal";
                storeName = "GeoDB";
            }
            if (zipFilePath != null)
            {
                string fileUri = zipFilePath.AbsolutePath;

                byte[] localShapeFile = readLocalShapeFile(fileUri);

                string sUrl = "http://localhost:8080/geoserver/rest/workspaces/" +
                                link + "/datastores/" + storeName + "/file.shp";
                using var client = new HttpClient();
                var authString = Convert.ToBase64String(Encoding.UTF8.GetBytes("admin:geoserver"));//авторизация
                client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authString);
                var content = new ByteArrayContent(localShapeFile);
                content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/zip"); //оправка zip

                var response = client.PutAsync(sUrl, content).Result;

            }
            return true;
        }
        [HttpPost]
        public async Task<IActionResult> AddFile(IFormFile uploadedFile, string uploadType)
        {
            /*Console.Write(uploadedFile);
            Console.Write(uploadedFile.FileName);*/
            var filePath = Path.GetTempFileName();
           var userRole = User.FindFirst(ClaimTypes.Role).Value;//определение роли пользователя
            if ((uploadType == "vector") || (userRole == "User"))
            {
                
            using (var stream = System.IO.File.Create(filePath))
            {       
                await uploadedFile.CopyToAsync(stream);
            };
                string fileName = uploadedFile.FileName;
                string datastore = fileName.Substring(0, fileName.Length - 4);
                AddVector(filePath,datastore);
            }
            else
            {
             /* var filePath2 = Path.GetTempFileName();
            using (var stream = System.IO.File.Create(filePath2))
            {       
                 uploadedFile.CopyTo(stream);
            };  */
            //filePath2
                AddRastor();
            }
           
            return RedirectToAction("Index", "Home");
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]

        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

    }
}