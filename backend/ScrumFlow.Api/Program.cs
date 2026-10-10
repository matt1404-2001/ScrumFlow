using Microsoft.EntityFrameworkCore;
using ScrumFlow.Api.Middleware;
using ScrumFlow.Aplicacion.Interfaces;
using ScrumFlow.Aplicacion.Servicios;
using ScrumFlow.Infraestructura.Autenticacion;
using ScrumFlow.Infraestructura.Datos;
using ScrumFlow.Infraestructura.Repositorios;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpContextAccessor();
builder.Services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase);
builder.Services.AddDbContext<ScrumFlowDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("ScrumFlow")));
builder.Services.AddScoped<IProductBacklogDbContext>(services => services.GetRequiredService<ScrumFlowDbContext>());
builder.Services.AddScoped<IProductBacklogServicio, ProductBacklogServicio>();
builder.Services.AddScoped<IAccesoProyecto, AccesoProyecto>();
builder.Services.AddScoped<IUsuarioActual, UsuarioActual>();
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy => policy.WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? []).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseMiddleware<ManejoErroresMiddleware>();
app.UseCors("Frontend");
app.MapControllers();
app.Run();

public partial class Program;
