import { GenezioDeploy, GenezioMethod } from "@genezio/types";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import XLSX from "xlsx";

export type DiplomaData = {
  id: string;
  licenseName: string;
  studentName: string;
  yearStudent: string;
  specialization: string;
  coordonatorName: string;
  departamentCoordonator: string;
  commisionPresident: string;
}

@GenezioDeploy()
export class DiplomaGenerator {
  constructor() {}

  @GenezioMethod()
  async generateDiplomaViaXLSX() {
    const workbook = XLSX.readFile('data/diplomas.xlsx');
    const sheet_name_list = workbook.SheetNames;
    const xlData: DiplomaData[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    for (const data of xlData) {
      if(data.licenseName===undefined)
        continue;
      await this.generateDiploma({
        id: data.id,
        licenseName: data.licenseName,
        studentName: data.studentName,
        yearStudent: data.yearStudent,
        specialization: data.specialization,
        coordonatorName: data.coordonatorName,
        departamentCoordonator: data.departamentCoordonator,
        commisionPresident: data.commisionPresident
      });
    }
  }

  @GenezioMethod()
  async generateDiploma(
    input: DiplomaData
  ) {
    const content = fs.readFileSync(
      "templates/template.docx",
      "binary"
    );

    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render({
      licenseName: input.licenseName,
      studentName: input.studentName,
      yearStudent: input.yearStudent,
      specialization: input.specialization,
      coordonatorName: input.coordonatorName,
      departamentCoordonator: input.departamentCoordonator,
      commisionPresident: input.commisionPresident
    });

    const buf = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    if (!fs.existsSync('./diplomas')) {
      fs.mkdirSync('./diplomas');
    }

    fs.writeFileSync(`./diplomas/diploma_${input.id}_${input.studentName}.docx`, buf);
  }
}
