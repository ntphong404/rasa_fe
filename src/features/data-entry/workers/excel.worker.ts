type ParsedRow = {
  rawName?: string;
  name: string;
  examples: string[];
  response?: string;
  responseContent?: string;
  status?: "pending" | "success" | "error";
  error?: string;
  validationError?: string;
};

type WorkerRequest =
  | { id: string; type: "parse-xlsx"; payload: { arrayBuffer: ArrayBuffer } }
  | { id: string; type: "generate-template" };

type WorkerResponse =
  | { id: string; success: true; data: ParsedRow[] }
  | { id: string; success: true; data: ArrayBuffer }
  | { id: string; success: false; error: string };

const ctx = self as any;

const formatIntentName = (input?: string): string => {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toLowerCase();
};

const parseXlsxFromBuffer = async (arrayBuffer: ArrayBuffer): Promise<ParsedRow[]> => {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0];

  const out: ParsedRow[] = [];
  worksheet.eachRow((row: any, rowNumber: number) => {
    if (rowNumber <= 2) return;

    const rawColB = (row.getCell(2).value ?? "").toString().trim();
    const rawColC = (row.getCell(3).value ?? "").toString().trim();

    if (!rawColB && !rawColC) return;

    out.push({
      rawName: rawColB,
      name: formatIntentName(rawColB || rawColC || ""),
      examples: [rawColB],
      response: rawColC,
    });
  });

  return out;
};

const generateTemplateWorkbook = async (): Promise<ArrayBuffer> => {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();

  const ws = workbook.addWorksheet("template");
  ws.getRow(1).values = ["STT", "VI DU MAU", ""];
  ws.getRow(2).values = ["", "Cau hoi", "Cau tra loi"];
  ws.getRow(3).values = [
    1,
    "Chay la gi",
    "Theo Khoan 1 Dieu 2, Luat Phong chay, chua chay va cuu nan, cuu ho 2024 quy dinh: Chay la phan ung...",
  ];

  ws.mergeCells("B1:C1");
  ws.mergeCells("A1:A2");

  ws.columns = [
    { key: "A", width: 6 },
    { key: "B", width: 40 },
    { key: "C", width: 100 },
  ];

  for (let r = 1; r <= 2; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= 3; c++) {
      const cell = row.getCell(c);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF00" },
      };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.font = { bold: true };
    }
    row.height = 18;
  }

  for (let r = 1; r <= 3; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= 3; c++) {
      const cell = row.getCell(c);
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  }

  const readme = workbook.addWorksheet("README");
  const instructions = [
    ["Huong dan / Instructions"],
    [""],
    ["File mau cho import du lieu (dinh dang mau):"],
    ["- Dong 1: Tieu de (VI DU MAU)."],
    ["- Dong 2: Header voi cac cot: STT | Cau hoi | Cau tra loi"],
    ["- Dong du lieu bat dau tu dong 3: cot A = STT (so), cot B = Cau hoi, cot C = Cau tra loi."],
    ["- Import se bo qua 2 dong dau tien va bo cot A (STT)."],
    ["- Cau tra loi se duoc dung lam noi dung response; neu can nhieu vi du trong cau hoi, tach bang ';'"],
  ];
  instructions.forEach((r, i) => (readme.getRow(i + 1).values = r));

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
};

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;

  try {
    if (req.type === "parse-xlsx") {
      const rows = await parseXlsxFromBuffer(req.payload.arrayBuffer);
      const res: WorkerResponse = { id: req.id, success: true, data: rows };
      ctx.postMessage(res);
      return;
    }

    if (req.type === "generate-template") {
      const templateBuffer = await generateTemplateWorkbook();
      const res: WorkerResponse = { id: req.id, success: true, data: templateBuffer };
      ctx.postMessage(res, [templateBuffer]);
    }
  } catch (error) {
    const res: WorkerResponse = {
      id: req.id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
    ctx.postMessage(res);
  }
};
