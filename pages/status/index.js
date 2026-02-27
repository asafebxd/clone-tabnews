import useSWR from "swr";

async function fetchAPI(endpoint) {
  const res = await fetch(endpoint);
  const resBody = await res.json();
  return resBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <DataResponse />
    </>
  );
}

function DataResponse() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAtText = "Loading...";
  let version = "Loading...";
  let maxConnections = "Loading...";
  let openedConnections = "Loading...";

  if (!isLoading && data) {
    const db = data?.dependencies?.database;
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
    version = db?.version;
    maxConnections = db?.max_connections;
    openedConnections = db?.opened_connections;
  }

  return (
    <div>
      <div>Última atualização: {updatedAtText}</div>
      <div>Versão do Postgres:{version}</div>
      <div>Maximo de conexões: {maxConnections}</div>
      <div>Conexões abertas: {openedConnections}</div>
    </div>
  );
}
