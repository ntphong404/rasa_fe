export type ParsedRow = {
  rawName?: string;
  name: string;
  examples: string[];
  label?: string;
  responseName?: string;
  response?: string;
  responseContent?: string;
  status?: "pending" | "success" | "error";
  error?: string;
  validationError?: string;
};

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

const normalizeCellValue = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }

  if (typeof value === "object") {
    const obj = value as {
      w?: string;
      v?: unknown;
      richText?: Array<{ text?: string }>;
    };

    if (Array.isArray(obj.richText)) {
      return obj.richText.map((part) => part?.text ?? "").join("").trim();
    }
    if (typeof obj.w === "string") return obj.w.trim();
    if (obj.v != null) return String(obj.v).trim();
  }

  return String(value).trim();
};

const parseSheetRows = (raw: unknown[][], sheetLabel: string): ParsedRow[] => {
  // Some files have 2 header rows, others only 1; pick the start row that yields most valid data.
  const candidates = [2, 1, 0];
  let best: ParsedRow[] = [];

  for (const startIndex of candidates) {
    const current: ParsedRow[] = [];

    for (let i = startIndex; i < raw.length; i++) {
      const row = raw[i] as unknown[] | undefined;
      const rawColB = normalizeCellValue(row?.[1]);
      const rawColC = normalizeCellValue(row?.[2]);

      if (!rawColB && !rawColC) continue;

      current.push({
        rawName: rawColB,
        name: formatIntentName(rawColB || rawColC || ""),
        examples: [rawColB],
        label: sheetLabel || undefined,
        response: rawColC,
      });
    }

    if (current.length > best.length) {
      best = current;
    }
  }

  return best;
};

export const parseXlsxFromBuffer = async (arrayBuffer: ArrayBuffer): Promise<ParsedRow[]> => {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const out: ParsedRow[] = [];
  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;

    const raw = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: null,
      blankrows: true,
    }) as unknown[][];

    const sheetLabel = String(sheetName ?? "").trim();
    out.push(...parseSheetRows(raw, sheetLabel));
  }

  return out;
};

export const generateTemplateWorkbook = async (): Promise<ArrayBuffer> => {
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
  if (buffer instanceof ArrayBuffer) {
    return buffer;
  }
  return new Uint8Array(buffer).buffer;
};
