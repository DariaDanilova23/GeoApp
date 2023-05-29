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
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using System.Text;

namespace GeoAuth.Controllers
{
    [Authorize]
    [Route("[controller]")]
    public class ShapeController : Controller
    {
        private readonly ILogger<ShapeController> _logger;
        private readonly ApplicationDbContext _context;
        private readonly UserManager<IdentityUser> _userManager;
        IWebHostEnvironment _appEnvironment;

        public ShapeController(ILogger<ShapeController> logger, IWebHostEnvironment appEnvironment)
        {
            _logger = logger;
            _appEnvironment = appEnvironment;
        }
        [HttpGet("/Shape")]
        public IActionResult Index()
        {
            return View();
        }

        private bool createdWorkspace(string my_workspace)
        {
            try
            {
                //Creating the HttpWebRequest
                string url = "http://localhost:8080/geoserver/rest/workspaces";
                WebRequest request = WebRequest.Create(url);

                request.ContentType = "text/xml";
                request.Method = "POST";
                request.Credentials = new NetworkCredential("admin", "geoserver"); //логин и пароль от geoserver

                byte[] buffer = Encoding.GetEncoding("UTF-8").GetBytes("<workspace><name>" + my_workspace + "</name></workspace>");
                Stream reqstr = request.GetRequestStream(); //Получаем поток
                reqstr.Write(buffer, 0, buffer.Length);//Записываем в поток название workspace
                reqstr.Close();
                WebResponse response = request.GetResponse(); // Получаем ответ
                return true;
            }
            catch
            {
                return false;
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddFile(IFormFile uploadedFile)
        {
            string link = "";
            var userId = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var userRole = User.FindFirst(ClaimTypes.Role).Value;
            if (userRole == "User") //если пользователь в роли обычного пользователя
            {
                createdWorkspace(userId); //вызов функции создания workspace с названием соответствующим id пользователя
                link = userId;
            }
            else if (userRole == "Provider") //если пользователь в роли поставщик
            {
                link = "geoportal";
            }
            string filename = Request.Form["fname"].ToString();
            if (uploadedFile != null && filename != null)
            {
                long length = uploadedFile.Length;//Определение длины файла
                using var fileStream = uploadedFile.OpenReadStream(); //Открытие потока для чтения
                byte[] buffer = new byte[length];//Создание буфера 
                fileStream.Read(buffer, 0, (int)uploadedFile.Length);// Чтение байтов из потока и запись данных в буфер.
                String sUrl = "http://localhost:8080/geoserver/rest/workspaces/" + link + "/datastores/" + filename + "/file.shp";

                WebRequest request = WebRequest.Create(sUrl);
                request.ContentType = "text/xml";
                request.Method = "PUT";
                request.Credentials = new NetworkCredential("admin", "geoserver");

                Stream requestStream = request.GetRequestStream();
                requestStream.Write(buffer, 0, buffer.Length);
                requestStream.Close();

                WebResponse response = request.GetResponse(); //получение ответа от Geoserver
                Console.Write("Response from GeoServer: " + response);
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