FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY EuDuvido.slnx .
COPY EuDuvido.Api/EuDuvido.Api.csproj EuDuvido.Api/
COPY EuDuvido.Api.Tests/EuDuvido.Api.Tests.csproj EuDuvido.Api.Tests/
RUN dotnet restore EuDuvido.Api/EuDuvido.Api.csproj

COPY . .
RUN dotnet publish EuDuvido.Api/EuDuvido.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
# curl existe so para o healthcheck do compose - a imagem base nao traz nenhum
# cliente HTTP.
RUN apt-get update && apt-get install -y --no-install-recommends curl     && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Migrations sao aplicadas na subida (ADR 0010) - o container espera o banco
# ficar saudavel via depends_on no compose.
ENTRYPOINT ["dotnet", "EuDuvido.Api.dll"]
