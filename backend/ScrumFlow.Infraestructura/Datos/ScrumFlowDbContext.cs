using Microsoft.EntityFrameworkCore;
using ScrumFlow.Aplicacion.Interfaces;
using ScrumFlow.Dominio.Entidades;

namespace ScrumFlow.Infraestructura.Datos;

public sealed class ScrumFlowDbContext(DbContextOptions<ScrumFlowDbContext> options) : DbContext(options), IProductBacklogDbContext
{
    public DbSet<Proyecto> Proyectos => Set<Proyecto>();
    public DbSet<MiembroProyecto> MiembrosProyecto => Set<MiembroProyecto>();
    public DbSet<ElementoBacklog> ElementosBacklog => Set<ElementoBacklog>();
    public DbSet<Sprint> Sprints => Set<Sprint>();
    public DbSet<ElementoSprint> ElementosSprint => Set<ElementoSprint>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Proyecto>(builder =>
        {
            builder.ToTable("Proyecto"); builder.HasKey(x => x.ProyectoId);
            builder.Property(x => x.ProyectoId).HasColumnName("proyecto_id"); builder.Property(x => x.ProductGoal).HasColumnName("product_goal");
            builder.HasMany(x => x.ElementosBacklog).WithOne(x => x.Proyecto).HasForeignKey(x => x.ProyectoId);
            builder.HasMany(x => x.Miembros).WithOne(x => x.Proyecto).HasForeignKey(x => x.ProyectoId);
        });
        modelBuilder.Entity<MiembroProyecto>(builder =>
        {
            builder.ToTable("MiembroProyecto"); builder.HasKey(x => x.MiembroProyectoId);
            builder.Property(x => x.MiembroProyectoId).HasColumnName("miembro_proyecto_id"); builder.Property(x => x.ProyectoId).HasColumnName("proyecto_id");
            builder.Property(x => x.UsuarioId).HasColumnName("usuario_id"); builder.Property(x => x.EsAdministrador).HasColumnName("es_administrador");
            builder.Property(x => x.EsProductOwner).HasColumnName("es_product_owner"); builder.Property(x => x.EsDeveloper).HasColumnName("es_developer");
            builder.Property(x => x.Activo).HasColumnName("activo");
        });
        modelBuilder.Entity<ElementoBacklog>(builder =>
        {
            builder.ToTable("ElementoBacklog"); builder.HasKey(x => x.ElementoBacklogId);
            builder.Property(x => x.ElementoBacklogId).HasColumnName("elemento_backlog_id"); builder.Property(x => x.ProyectoId).HasColumnName("proyecto_id");
            builder.Property(x => x.Titulo).HasColumnName("titulo"); builder.Property(x => x.Descripcion).HasColumnName("descripcion");
            builder.Property(x => x.Prioridad).HasColumnName("prioridad"); builder.Property(x => x.Posicion).HasColumnName("posicion");
            builder.Property(x => x.Estimacion).HasColumnName("estimacion"); builder.Property(x => x.CriteriosAceptacion).HasColumnName("criterios_aceptacion");
            builder.Property(x => x.Retirado).HasColumnName("retirado"); builder.Property(x => x.FechaRetiro).HasColumnName("fecha_retiro");
            builder.HasMany(x => x.ElementosSprint).WithOne(x => x.ElementoBacklog).HasForeignKey(x => x.ElementoBacklogId);
        });
        modelBuilder.Entity<Sprint>(builder =>
        {
            builder.ToTable("Sprint"); builder.HasKey(x => x.SprintId); builder.Property(x => x.SprintId).HasColumnName("sprint_id");
            builder.Property(x => x.ProyectoId).HasColumnName("proyecto_id"); builder.Property(x => x.Estado).HasColumnName("estado");
            builder.HasMany(x => x.ElementosSprint).WithOne(x => x.Sprint).HasForeignKey(x => x.SprintId);
        });
        modelBuilder.Entity<ElementoSprint>(builder =>
        {
            builder.ToTable("ElementoSprint"); builder.HasKey(x => x.ElementoSprintId); builder.Property(x => x.ElementoSprintId).HasColumnName("elemento_sprint_id");
            builder.Property(x => x.SprintId).HasColumnName("sprint_id"); builder.Property(x => x.ElementoBacklogId).HasColumnName("elemento_backlog_id");
        });
    }
}
