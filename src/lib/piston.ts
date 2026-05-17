const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

type PistonRunResult = {
  stdout: string;
  stderr: string;
  code: number;
  output: string;
};

type PistonResponse = {
  language: string;
  version: string;
  run: PistonRunResult;
  compile?: PistonRunResult;
};

type PistonRuntime = {
  language: string;
  version: string;
  aliases: string[];
};

export async function executeCode(
  language: string,
  code: string,
): Promise<PistonResponse> {
  const runtimes = await getAvailableRuntimes();
  const runtime = runtimes.find(
    (r) => r.language === language || r.aliases.includes(language),
  );

  if (!runtime) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const response = await fetch(`${PISTON_API_URL}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: runtime.language,
      version: runtime.version,
      files: [{ content: code }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Piston API error: ${response.status}`);
  }

  return response.json() as Promise<PistonResponse>;
}

let cachedRuntimes: PistonRuntime[] | null = null;

export async function getAvailableRuntimes(): Promise<PistonRuntime[]> {
  if (cachedRuntimes) return cachedRuntimes;

  const response = await fetch(`${PISTON_API_URL}/runtimes`);
  if (!response.ok) {
    throw new Error(`Failed to fetch runtimes: ${response.status}`);
  }

  cachedRuntimes = (await response.json()) as PistonRuntime[];
  return cachedRuntimes;
}
