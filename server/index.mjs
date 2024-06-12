import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import serverless from 'serverless-http';
import bodyParser from "body-parser";
import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const generateDiploma = async (input, fileNameTemplateDocx) => {
    try {
        const templatePath = `/tmp/templates/${fileNameTemplateDocx}`;
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at ${templatePath}`);
        }
        const content = fs.readFileSync(templatePath, "binary");
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true, linebreaks: true,
        });

        doc.render(input);

        const buf = doc.getZip().generate({
            type: "nodebuffer", compression: "DEFLATE",
        });

        const diplomaDir = '/tmp/diplomas';
        if (!fs.existsSync(diplomaDir)) {
            fs.mkdirSync(diplomaDir, { recursive: true });
        }

        const fileName = `${diplomaDir}/${input["id"]}_${input["studentName"]}.docx`;
        fs.writeFileSync(fileName, buf);
    } catch (error) {
        console.error("Error generating diploma: ", error);
        throw error;
    }
};

const generateDiplomaViaXLSX = async (fileNameTemplateDocx, fileNameDataExcel) => {
    try {
        const dataPath = `/tmp/data/${fileNameDataExcel}`;
        if (!fs.existsSync(dataPath)) {
            throw new Error(`Data file not found at ${dataPath}`);
        }
        const workbook = XLSX.readFile(dataPath);
        const sheet_name_list = workbook.SheetNames;
        const xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

        for (const data of xlData) {
            await generateDiploma(data, fileNameTemplateDocx);
        }

        console.log("Diplomas generated successfully!");
        return 0;
    } catch (error) {
        console.error("Error generating diplomas: ", error);
        throw error;
    }
};

const uploadExcel = async (fileBuffer) => {
    try {
        console.log("Uploading Excel file...");
        const buffer = Buffer.from(fileBuffer);
        const new_uuid = uuidv4();
        const filePath = `/tmp/data/${new_uuid}_diplomas.xlsx`
        if (!fs.existsSync('/tmp/data')) {
            fs.mkdirSync('/tmp/data', { recursive: true });
        }
        fs.writeFileSync(filePath, buffer);
        console.log(`File uploaded successfully to ${filePath}`);
        return {
            status: 200, message: "Fișierul Excel a fost încărcat cu succes!", fileName: `${new_uuid}_diplomas.xlsx`,
        }
    } catch (error) {
        console.error("Error uploading file: ", error);
        throw error;
    }
};

const uploadDocx = async (fileBuffer) => {
    try {
        console.log("Uploading DOCX template...");
        const buffer = Buffer.from(fileBuffer);
        const new_uuid = uuidv4();
        const filePath = `/tmp/templates/${new_uuid}_template.docx`;

        if (!fs.existsSync('/tmp/templates')) {
            fs.mkdirSync('/tmp/templates', { recursive: true });
        }
        fs.writeFileSync(filePath, buffer);

        console.log(`Template uploaded successfully to ${filePath}`);
        return {
            status: 200, message: "Template-ul DOCX a fost încărcat cu succes!", fileName: `${new_uuid}_template.docx`,
        };
    } catch (error) {
        console.error("Error uploading DOCX template: ", error);
        throw error;
    }
};

app.post('/upload-docx', upload.single('file'), async (req, res) => {
    try {
        const response = await uploadDocx(req.file.buffer);
        res.send(response);
    } catch (error) {
        console.log("Error uploading DOCX file: ", error)
        res.status(500).send({ error: 'Eroare la încărcarea fișierului DOCX.' });
    }
});

app.post('/upload-excel', upload.single('file'), async (req, res) => {
    try {
        const response = await uploadExcel(req.file.buffer);
        res.send(response);
    } catch (error) {
        console.log("Error uploading Excel file: ", error)
        res.status(500).send({ error: 'Eroare la încărcarea fișierului Excel.' });
    }
});

app.get('/generate-diplomas', async (req, res) => {
    try {
        const fileNameTemplateDocx = req.query.template;
        const fileNameDataExcel = req.query.data;

        if (!fileNameTemplateDocx || !fileNameDataExcel) {
            res.status(400).send({ error: 'Parametrii sunt incompleți.' });
            return;
        }

        await generateDiplomaViaXLSX(fileNameTemplateDocx, fileNameDataExcel);
        res.send({ status: 200, message: "Diplomele au fost generate cu succes!" });
    } catch (error) {
        console.log("Error generating diplomas: ", error)
        res.status(500).send({ error: 'Eroare la generarea diplomelor.' });
    }
});

app.get('/download-diplomas', (req, res) => {
    const diplomaDir = '/tmp/diplomas';
    if (!fs.existsSync(diplomaDir)) {
        res.status(404).send({ error: 'Nu s-au generat diplome.' });
        return;
    }

    const zipFilePath = `/tmp/diplomas.zip`;
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });

    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
        res.download(zipFilePath, 'diplomas.zip', (err) => {
            if (err) {
                res.status(500).send({ error: 'Eroare la descărcarea fișierului ZIP.' });
            }
        });
    });

    archive.on('error', function (err) {
        throw err;
    });

    archive.pipe(output);

    archive.directory(diplomaDir, false);

    archive.finalize();
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(3000, () => {
    console.log('Server listening on port 3000');
});

export const handler = serverless(app);
