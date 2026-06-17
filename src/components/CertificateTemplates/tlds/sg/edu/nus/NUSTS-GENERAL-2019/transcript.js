/* eslint-disable prettier/prettier */
import React, { Fragment } from "react";
import PropTypes from "prop-types";
import {
  isoDateToLocal,
  sassClassNames,
  NUS_TS_BACKIMG,
  NUS_TS_BACKIMG_YALE,
  NUS_TS_LEGEND,
  NUS_TS_LEGEND_DUKE,
  NUS_TS_LEGEND_YALE,
  NUS_TS_LEGEND_2023,
  NUS_TS_LEGEND_2024,
  NUS_TS_LEGEND_2026,
  NUS_TS_LEGEND_DUKE_2023,
  NUS_TS_LEGEND_DUKE_2026,
  NUS_TS_LEGEND_YALE_2023
} from "../common";
import {
  TranscriptDataFeeder,
  Transcript,
  renderTranscriptHeaderData
} from "../common/transcriptFramework";
import scss from "../common/transcriptFramework.scss";

// construct class names
const cls = names => sassClassNames(names, scss);

// cutoff date for revamped transcript format
const revCutOffDate2021 = "2021-08-10";

// cutoff date for displaying dismissal remarks
const dismissalRemarksCutOffDate = "2019-06-13";

// cut off date for displaying new legend
const termsChangeCutoffDate2023 = "2023-08-01";

// cut off date for updated UG/GD legend after new appointment
const newAppointmentCutoffDate2024 = "2024-01-01";
// effective date for new legend 2026
const newLegend2026 = "2026-01-01";
// effective date for new DUKE legend 2026
const newLegendDuke2026 = "2026-06-30";

// flags to calssify transcript type
let isUG;
let isGD;
let isDuke;
let isMedDen;
let isCDP;
let isYaleNUS;
let isYALENUSDegree = false;
let isDegreeScroll;
let isNG;
let isOfficial;
let isConferred;
let isRev2021;
let toDisplayDismissalRemarks;
let CAPtoGPAlong;
let CAPtoGPA;
let moduletoCourse;
let modcreditstoUnits;
let creditsTounits;

// Yale-NUS specific attributes and function
let lastTermYaleNUS;
let progNameYaleNUS;
const yncCommensurateRemark = gpa => {
  if (gpa >= 4.5)
    return `THIS ${CAPtoGPA} IS COMMENSURATE WITH NUS' HONOURS (HIGHEST DISTINCTION)`;
  if (gpa >= 4)
    return `THIS ${CAPtoGPA} IS COMMENSURATE WITH NUS' HONOURS (DISTINCTION)`;
  if (gpa >= 3.5) return `THIS ${CAPtoGPA} IS COMMENSURATE WITH NUS' HONOURS (MERIT)`;
  return null;
};

// check whether a term is first term
const firstTermIdxes = [];
const isFirstTerm = termIdx => firstTermIdxes.indexOf(termIdx) >= 0;

// transcript content - program info
class TranscriptProgram {
  constructor(dataSource, dataFeeder) {
    this.dataSource = dataSource;
    this.dataFeeder = dataFeeder;
  }

  // main render
  render() {
    const progData = this.dataSource.additionalData.programData;
    if (progData) {
      progData.forEach(data => {
        if (data.statusCode !== "DC") this.renderProgData(data);
      });
      this.dataFeeder.push(
        "ts-prog-end",
        <td colSpan="4">
          <hr />
        </td>
      );
    }
  }

  // render for a program
  renderProgData(data) {
    if (isNG)
      this.dataFeeder.push(
        "ts-prog",
        <td colSpan="4">
          <table width="100%">
            <tr>
              <td width="30%" valign="top" className={cls("ts-title prog-key")}>
                PROGRAMME:
              </td>
              <td width="70%" valign="top" className={cls("ts-title")}>
                NON GRADUATING PROGRAMME
              </td>
            </tr>
            <tr>
              <td className={cls("ts-title prog-key")}>PROGRAMME STATUS:</td>
              <td className={cls("ts-title")}>
                {data.statusDescription.toUpperCase()}
              </td>
            </tr>
          </table>
        </td>
      );
    else 
      this.dataFeeder.push(
        "ts-prog",
        <td colSpan="4">
          <table width="100%">
            <tr>
              <td width="30%" valign="top" className={cls("ts-title prog-key")}>
                PROGRAMME:
              </td>
              <td width="70%" valign="top" className={cls("ts-title")}>
                {data.programName.toUpperCase()}
                <br />
                {isDuke ? "DUKE-NUS MEDICAL SCHOOL" : null}
              </td>
            </tr>
            <tr>
              <td className={cls("ts-title prog-key")}>PROGRAMME STATUS:</td>
              <td className={cls("ts-title")}>
                {data.statusDescription.toUpperCase()}
              </td>
            </tr>
          </table>
        </td>
      );
  }
}

// transcript credit transfer
class TranscriptCreditTransfer {
  // constructor
  constructor(termData, termIdx, dataFeeder) {
    this.termData = termData;
    this.termIdx = termIdx;
    this.dataFeeder = dataFeeder;
  }

  // main render
  render() {
    // bypass non-transfer
    if (this.termData.creditTransfer) {
      // identify external and internal
      let internal = false;
      let external = false;
      for (let i = 0; i < this.termData.creditTransfer.length; i += 1) {
        const transferData = this.termData.creditTransfer[i];
        if (transferData.sourceType === "E") external = true;
        else if (transferData.sourceType === "I") internal = true;
        if (internal && external) break;
      }
      if (isFirstTerm(this.termIdx)) {
        // only print in 1st term
        if (external) {
          // external transfer title
          this.renderExtTrfTitle();
          // APC
          this.renderAPC();
        } else {
          // internal APC
          this.renderIntAPC();
        }
      }
      if (isCDP || !isFirstTerm(this.termIdx)) {
        // only print for 2nd term onward
        this.renderIntTrfSummary();
      }
      this.renderIntTrfDetail();
      if (isMedDen) this.renderFormOfStudy();
      if (!isFirstTerm(this.termIdx)) {
        // from 2nd term onward
        this.renderTrfFromExtOrg();
      }
      this.renderTrfEqualNUS();
    }
  }

  // render external transfer title
  renderExtTrfTitle() {
    this.dataFeeder.push(
      "ts-term-trf-extitle",
      <td colSpan="4" className={cls("ts-termrem ts-highlight")}>
        CREDITS RECOGNISED ON ADMISSION
      </td>
    );
  }

  // render APC
  renderAPC() {
    this.termData.creditTransfer.forEach(transferData => {
      if (transferData.sourceType === "E" && transferData.creditsNoGPA > 0) {
        // APC
        if (isCDP) {
          const isNUSAPCTest = transferData.orgId === "E0000002277";
          const isAPC = transferData.orgId === "E0000002430";
          let title = "";
          if (!isNUSAPCTest && !isAPC) {
            title = `AWARDED ADVANCED PLACEMENT CREDITS FOR THE ACADEMIC WORK COMPLETED AT ${transferData.orgName.toUpperCase()}`;
          } else if (isNUSAPCTest) {
            title =
              "AWARDED ADVANCED PLACEMENT CREDITS FOR PASSING THE PLACEMENT TEST(S) CONDUCTED BY NUS";
          }
          if (title) {
            this.dataFeeder.push(
              "ts-term-trf-apc",
              <Fragment>
                <td colSpan="2" className={cls("ts-termrem")}>
                  {title}
                </td>
                <td className={cls("ts-grade")}>-</td>
                <td className={cls("ts-credits")}>
                  {transferData.creditsNoGPA.toFixed(2)}
                </td>
              </Fragment>
            );
          }
        } else {
          this.dataFeeder.push(
            "ts-term-trf-apc",
            <Fragment>
              <td colSpan="2" className={cls("ts-termrem")}>
                AWARDED ADVANCED PLACEMENT CREDITS FOR THE ACADEMIC WORK
                COMPLETED AT {transferData.orgName.toUpperCase()}
              </td>
              <td className={cls("ts-grade")}>-</td>
              <td className={cls("ts-credits")}>
                {isMedDen ? "" : transferData.creditsNoGPA.toFixed(2)}
              </td>
            </Fragment>
          );
        }
      }
    });
  }

  // render internal APC
  renderIntAPC() {
    this.termData.creditTransfer.forEach(transferData => {
      if (transferData.sourceType === "I") {
        const isNUSAPCTest = transferData.orgId === "E0000002277";
        const isAPC = transferData.orgId === "E0000002430";
        let title;
        if (isDuke || isMedDen) {
          title =
            `CREDITS RECOGNISED ON ADMISSION (NUS ${moduletoCourse}S COMPLETED PRIOR TO CURRENT PROGRAMME):`;
        } else if (!isNUSAPCTest && !isAPC) {
          if (!isCDP || transferData.reportNo === 1)
            title =
              `CREDITS RECOGNISED ON ADMISSION (NUS ${moduletoCourse}S COMPLETED PRIOR TO CURRENT PROGRAMME):`;
        } else if (isNUSAPCTest) {
          title =
            "AWARDED ADVANCED PLACEMENT CREDITS FOR PASSING THE PLACEMENT TEST(S) CONDUCTED BY NUS";
        } else {
          // isAPC === true
          title = "AWARDED ADVANCED PLACEMENT CREDITS";
        }
        if (title) {
          const grade = isNUSAPCTest || isAPC ? "-" : "";
          const credits =
            transferData.creditsNoGPA !== 0
              ? transferData.creditsNoGPA.toFixed(2)
              : "";
          this.dataFeeder.push(
            "ts-term-trf-intapc",
            <Fragment>
              <td colSpan="2" className={cls("ts-termrem")}>
                {title}
              </td>
              <td className={cls("ts-grade")}>{grade}</td>
              <td className={cls("ts-credits")}>{credits}</td>
            </Fragment>
          );
        }
      }
    });
  }

  // render internal transfer summary
  renderIntTrfSummary() {
    this.termData.creditTransfer.forEach(transferData => {
      const isNUSAPCTest = transferData.orgId === "E0000002277";
      const isAPC = transferData.orgId === "E0000002430";
      if (
        transferData.sourceType === "I" &&
        (!isCDP || (isCDP && !isNUSAPCTest && !isAPC))
      ) {
        let title;
        if (transferData.sourceCareer) {
          title = `CREDITS RECOGNISED (COMPLETED ${moduletoCourse}S FROM ${transferData.sourceCareer.toUpperCase()} CAREER)`;
        } else if (!isMedDen) {
          title = `CREDITS RECOGNISED (COMPLETED ${moduletoCourse}S FROM OTHER PROGRAMME)`;
        }
        const credits =
          transferData.creditsNoGPA !== 0 && !isMedDen
            ? transferData.creditsNoGPA.toFixed(2)
            : "";
        this.dataFeeder.push(
          "ts-term-trf-inttrf",
          <Fragment>
            <td colSpan="3" className={cls("ts-termrem")}>
              {title}
            </td>
            <td className={cls("ts-credits")}>{credits}</td>
          </Fragment>
        );
      }
    });
  }

  // render internal transfer details
  renderIntTrfDetail() {
    this.termData.creditTransfer.forEach(transferData => {
      if (
        transferData.sourceType === "I" &&
        ((isDuke && transferData.creditsNoGPA > 0) || !isDuke)
      ) {
        transferData.details.forEach(detail => {
          if (
            detail.status === "P" &&
            (detail.includeInGPA ||
              (detail.grade === "S" || detail.grade === "CS") ||
              isMedDen)
          ) {
            let credits = "";
            if (!isMedDen)
              credits = detail.credits !== 0 ? detail.credits.toFixed(2) : "-";
            this.dataFeeder.push(
              "ts-term-trf-inttrfdtl",
              <Fragment>
                <td className={cls("ts-col0 ts-modcode")}>
                  {detail.moduleCode}
                </td>
                <td className={cls("ts-col1 ts-modname")}>
                  {detail.moduleName}
                </td>
                <td className={cls("ts-col2 ts-grade")}>{detail.grade}</td>
                <td className={cls("ts-col3 ts-credits")}>{credits}</td>
              </Fragment>
            );
          }
        });
      }
    });
  }

  // render credit transfer from ext organization
  renderTrfFromExtOrg() {
    this.termData.creditTransfer.forEach(transferData => {
      if (transferData.sourceType === "E" && transferData.creditsNoGPA > 0) {
        this.dataFeeder.push(
          "ts-term-trf-fromorg",
          <Fragment>
            <td colSpan="2" className={cls("ts-termrem")}>
              CREDITS TRANSFERRED FROM {transferData.orgName.toUpperCase()}
            </td>
            <td className={cls("ts-grade")}>-</td>
            <td className={cls("ts-credits")}>
              {isMedDen ? "" : transferData.creditsNoGPA.toFixed(2)}
            </td>
          </Fragment>
        );
      }
    });
  }

  // render credit transfer with equalivalent NUS grade from ext organization
  renderTrfEqualNUS() {
    this.termData.creditTransfer.forEach(transferData => {
      if (transferData.sourceType === "E" && transferData.creditsGPA > 0) {
        this.dataFeeder.push(
          "ts-term-trf-eqnus",
          <td colSpan="4" className={cls("ts-termrem")}>
            CREDITS TRANSFERRED (WITH EQUIVALENT NUS GRADE) FROM
            {` ${transferData.orgName.toUpperCase()}`}:
          </td>
        );
        transferData.details.forEach(detail => {
          if (
            detail.status === "P" &&
            (detail.includeInGPA ||
              (detail.grade === "S" || detail.grade === "CS"))
          ) {
            let credits = "";
            if (!isMedDen)
              credits = detail.credits !== 0 ? detail.credits.toFixed(2) : "-";
            this.dataFeeder.push(
              "ts-term-trf-eqnusdtl",
              <Fragment>
                <td className={cls("ts-col0 ts-modcode")}>
                  {detail.moduleCode}
                </td>
                <td className={cls("ts-col1 ts-modname")}>
                  {detail.moduleName}
                </td>
                <td className={cls("ts-col2 ts-grade")}>{detail.grade}</td>
                <td className={cls("ts-col3 ts-credits")}>{credits}</td>
              </Fragment>
            );
          }
        });
      }
    });
  }
}

// render individual module enrollment info
class TranscriptModuleEnroll {
  // constructor
  constructor(data, dataFeeder) {
    this.data = data;
    this.dataFeeder = dataFeeder;
  }

  // main render
  render() {
    let { moduleCode } = this.data;
    if (
      (this.data.gradingBasis === "NCP" && !this.data.includeInGPA) ||
      this.data.remarks
    )
      moduleCode = `*${moduleCode}`;
    let moduleDescr = this.data.moduleName;
    const isMedDenSuppl =
      isMedDen &&
      (this.data.gradingBasis === "SUP" || this.data.gradingBasis === "SPN");
    if (this.data.moduleType && !isMedDenSuppl)
      moduleDescr += ` ${this.data.moduleType}`;
    if (this.data.moduleNotes) moduleDescr += ` ${this.data.moduleNotes}`;
    let credits = "";
    if (!isMedDen)
      credits = this.data.credits === 0 ? "-" : this.data.credits.toFixed(2);
    this.dataFeeder.push(
      "ts-term-enl-mod",
      <Fragment>
        <td className={cls("ts-col0 ts-modcode")}>{moduleCode}</td>
        <td className={cls("ts-col1 ts-modname")}>{moduleDescr}</td>
        <td className={cls("ts-col2 ts-grade")}>{this.data.grade}</td>
        <td className={cls("ts-col3 ts-credits")}>{credits}</td>
      </Fragment>
    );
  }
}

// render module enrollment
class TranscriptEnrollment {
  // constructor
  constructor(termData, dataFeeder) {
    this.termData = termData;
    this.dataFeeder = dataFeeder;
  }

  // main render
  render() {
    this.renderEnrollData();
  }

  // render module enrollment title
  renderEnrollTitle() {
    this.dataFeeder.push(
      "ts-term-enl-title",
      <td colSpan="4" className={cls("ts-termrem ts-highlight")}>
        <p />
        ENROLLED IN THE FOLLOWING NUS {moduletoCourse}S:
      </td>
    );
  }

  // render supplementary exam title
  renderSupplementaryTitle() {
    this.dataFeeder.push(
      "ts-term-enl-suptitle",
      <td colSpan="4" className={cls("ts-termrem ts-highlight")}>
        <p />
        SUPPLEMENTARY EXAMINATION:
      </td>
    );
  }

  // render repeat modules title
  renderRepeatModulesTitle() {
    this.dataFeeder.push(
      "ts-term-enl-suptitle",
      <td colSpan="4" className={cls("ts-termrem")}>
        REPEAT {moduletoCourse}(S):
      </td>
    );
  }

  // render remediate modules title
  renderRemediateModulesTitle() {
    this.dataFeeder.push(
      "ts-term-enl-suptitle",
      <td colSpan="4" className={cls("ts-termrem")}>
        REMEDIATE {moduletoCourse}(S):
      </td>
    );
  }

  // render module enrollment data
  renderEnrollData() {
    if (!this.termData.modules) return;
    if (this.termData.creditTransfer && this.termData.modules) {
      this.renderEnrollTitle();
    }
    let hasSuppl = false;
    let hasRepeat = false;
    let hasRemediate = false;
    this.termData.modules.forEach(data => {
      if (
        data.gradingBasis === "SUP" ||
        (isMedDen && data.gradingBasis === "SPN")
      )
        hasSuppl = true;
      else if (isDuke && data.gradingBasis === "REP") hasRepeat = true;
      else if (isDuke && data.gradingBasis === "REM") hasRemediate = true;
      else new TranscriptModuleEnroll(data, this.dataFeeder).render();
    });
    if (hasSuppl) {
      this.renderSupplementaryTitle();
      this.termData.modules.forEach(data => {
        if (data.gradingBasis === "SUP")
          new TranscriptModuleEnroll(data, this.dataFeeder).render();
      });
    }
    if (hasRepeat) {
      // only for DUKE
      this.renderRepeatModulesTitle();
      this.termData.modules.forEach(data => {
        if (data.gradingBasis === "REP")
          new TranscriptModuleEnroll(data, this.dataFeeder).render();
      });
    }
    if (hasRemediate) {
      // only for DUKE
      this.renderRemediateModulesTitle();
      this.termData.modules.forEach(data => {
        if (data.gradingBasis === "REM")
          new TranscriptModuleEnroll(data, this.dataFeeder).render();
      });
    }
  }
}

// render transcript summary
class TranscriptSummary {
  // constructor
  constructor(termData, dataFeeder) {
    this.termData = termData;
    this.dataFeeder = dataFeeder;
  }

  // main render
  render() {
    const isLastYNCTerm =
      isYaleNUS && lastTermYaleNUS && lastTermYaleNUS === this.termData.name;
    this.termData.summary.forEach(data => {
      if (!isNG) {
        // most of term summary not applicable to NGRD
        // degree name
        if (!isMedDen) this.renderTermDegree(data);
        // GPA
        if (data.specialGPA) this.renderSpecialGPA(data);
        else if (!isMedDen) this.renderGPA(data);
        // render special remarks for Yale-NUS
        if (!isRev2021 && isLastYNCTerm && progNameYaleNUS === data.programName)
          this.renderYNCRemarks(data);
        // acad standing
        if (isMedDen) this.renderAcadStanding(data);
      }
      // term honours
      if (data.awards) this.renderTermHonours(data);
    });
  }

  // render degree
  renderTermDegree(sumData) {
    this.dataFeeder.push(
      "ts-term-deg",
      <td colSpan="4" className={cls("ts-termrem ts-highlight")}>
        <p />
        {sumData.programName.toUpperCase()}
      </td>
    );
  }

  // render GPA
  renderGPA(sumData) {
    let gpa;
    let gpaName;
    let gpa1;
    let gpaName1;
        
    if (sumData.includeInGPA || isDuke) {
      if (sumData.disableGPA) {
        gpa = "NOT APPLICABLE";
        gpaName = `${CAPtoGPAlong}`;
      } else {
        gpa = sumData.GPA.toFixed(2);
        gpaName = sumData.GPAName.toUpperCase();
        // gpa1 and gpaName1 are only for TDSI programs
        if (sumData.GPAName1) {
          gpa1 = sumData.GPA1.toFixed(2);
          gpaName1 = sumData.GPAName1.toUpperCase();
        }
      }
    } else {
      gpa = "NOT APPLICABLE";
      gpaName = `${CAPtoGPAlong}`;
    }
    this.dataFeeder.push(
      "ts-term-gpa",
      <td colSpan="4" className={cls("ts-termrem ts-highlight")}>
        {`${gpaName} : ${gpa}`}
      </td>
    );
    if (gpaName1)
      this.dataFeeder.push(
        "ts-term-gpa",
        <td colSpan="4" className={cls("ts-termrem ts-highlight")}>
          {`${gpaName1} : ${gpa1}`}
        </td>
      );
  }

  // render Yale-NUS remarks
  renderYNCRemarks = sumData => {
    if (isYaleNUS && sumData.includeInGPA) {
      const gpa = sumData.GPA.toFixed(2);
      const remarks = yncCommensurateRemark(gpa);
      if (remarks)
        this.dataFeeder.push(
          "ts-term-gpa",
          <td colSpan="4" className={cls("ts-termrem ts-highlight")}>
            {`(${remarks})`}
          </td>
        );
    }
  };

  // render special GPA
  renderSpecialGPA(sumData) {
    sumData.specialGPA.forEach(data => {
      const name =
        data.type === "FCAP" || data.type === "FGPA"
          ? `${data.name}*`
          : `${data.name}`;
      this.dataFeeder.push(
        "ts-term-sgpa",
        <td colSpan="4" className={cls("ts-termrem ts-highlight")}>
          {`${name.toUpperCase()} : ${data.GPA.toFixed(2)}`}
        </td>
      );
    });
  }

  // render acad standing
  renderAcadStanding(sumData) {
    if (sumData.standing)
      this.dataFeeder.push(
        "ts-term-standing",
        <td colSpan="4" className={cls("ts-termrem ts-highlight")}>
          {`RESULT : ${sumData.standing.toUpperCase()}`}
        </td>
      );
  }

  // render term honours
  renderTermHonours(sumData) {
    sumData.awards.forEach(data => {
      this.dataFeeder.push(
        "ts-term-awd",
        <td colSpan="4" className={cls("ts-termrem ts-highlight")}>
          {data.awardName.toUpperCase()}
        </td>
      );
    });
  }
}

// render remarks at the end of a term
class TranscriptTermRemarks {
  // constructor
  constructor(termData, dataFeeder) {
    this.termData = termData;
    this.cache = new TranscriptDataFeeder();
    this.dataFeeder = dataFeeder;
  }

  // main render
  render() {
    this.renderEnrollRemarks();
    this.renderTransferRemarks();
    if (!isMedDen) this.renderFinalGPARemarks();
    this.renderTranscriptTexts();
    if (this.cache.length === 0) return;
    this.renderRemarksTitle();
    for (let i = 0; i < this.cache.length; i += 1) {
      this.dataFeeder.push(this.cache.type(i), this.cache.data(i));
    }
  }

  // render remarks title
  renderRemarksTitle() {
    this.dataFeeder.push(
      "ts-term-rem-title",
      <td colSpan="4" className={cls("ts-termrem ts-highlight")}>
        <p />
        <u>REMARKS:</u>
      </td>
    );
  }

  // render enrollment remarks
  renderEnrollRemarks() {
    if (this.termData.modules) {
      // remarks of NCP
      this.termData.modules.forEach(data => {
        if (
          !data.includeInGPA &&
          data.gradingBasis === "NCP" &&
          !isDuke &&
          !isMedDen
        ) {
          this.cache.push(
            "ts-term-rem-ncp",
            <td colSpan="4" className={cls("ts-termrem")}>
              *{data.moduleCode} - {moduletoCourse} WAS EXCLUDED FROM COMPUTATION OF THE
              FINAL {CAPtoGPAlong}/MARKS.
            </td>
          );
        }
      });
      // other remarks
      this.termData.modules.forEach(data => {
        if (data.remarks) {
          this.cache.push(
            "ts-term-rem-oth",
            <td colSpan="4" className={cls("ts-termrem")}>
              {data.moduleCode} - {data.remarks}
            </td>
          );
        }
      });
    }
  }

  // render credit transfer remarks
  renderTransferRemarks() {
    if (this.termData.creditTransfer && this.termData.formOfStudy !== "NOC") {
      this.termData.creditTransfer.forEach(transferData => {
        if (transferData.sourceType === "E") {
          const isNUSAPCTest = transferData.orgId === "E0000002277";
          const isAPC = transferData.orgId === "E0000002430";
          if ((!isNUSAPCTest && !isAPC) || isDuke || isMedDen) {
            this.cache.push(
              "ts-term-rem-trf",
              <td colSpan="4" className={cls("ts-termrem")}>
                PLEASE REFER TO THE TRANSCRIPT OF {transferData.orgName.toUpperCase()} FOR
                DETAILS OF {moduletoCourse}S TAKEN AND GRADES/{creditsTounits} OBTAINED.
              </td>
            );
          }
        }
      });
    }
  }

  // render final GPA remarks
  renderFinalGPARemarks() {
    // check existence of final GPA
    const hasFinalGPA = this.termData.summary.some(data => {
      let found = false;
      if (data.specialGPA) {
        found = data.specialGPA.some(
          sdata => sdata.type === "FGPA" || sdata.type === "FCAP"
        );
        if (found) return true;
      }
      return false;
    });
    if (hasFinalGPA) {
      this.cache.push(
        "ts-term-rem-fgpa",
        <td colSpan="4" className={cls("ts-termrem")}>
          THE FINAL {CAPtoGPAlong} TAKES INTO ACCOUNT THE STUDENT&lsquo;S
          ACADEMIC PERFORMANCE AT THE PARTNER UNIVERSITY.
        </td>
      );
    }
  }

  // render transcript texts
  renderTranscriptTexts() {
    if (!this.termData.remarks) return;
    let text = "";
    this.termData.remarks.forEach(data => {
      text += `${data.trim()} `;
    });
    if (text) {
      this.cache.push(
        "ts-term-rem-txt",
        <td colSpan="4" className={cls("ts-termrem")}>
          {text}
        </td>
      );
    }
  }
}

// translate module information
const translateModule = module => {
  const translated = {};
  for (const key in module) {
    switch (key) {
      case "name":
        if (
          module.name.startsWith("(") &&
          module.name.endsWith(")") &&
          module.transferSeq
        )
          translated.moduleName = "";
        else translated.moduleName = module.name;
        break;
      case "grade":
        translated.grade = module[key];
        break;
      case "courseCredit":
        translated.credits = module[key];
        break;
      case "courseCode":
        translated.moduleCode = module[key];
        break;
      default:
        translated[key] = module[key];
        break;
    }
  }
  return translated;
};

// traverse transcript data to retrieve matched credit transfer details
const getCreditTransferDetails = (transcriptData, semester, reportNo, seq) => {
  const details = [];
  transcriptData.forEach(module => {
    if (
      module.semester === semester &&
      module.reportNo === reportNo &&
      module.transferSeq &&
      module.transferSeq === seq
    )
      details.push(translateModule(module));
  });
  return details;
};

// traverse transcript data to retrieve enrolment modules
const getEnrolmentModules = (transcriptData, semester, reportNo) => {
  const modules = [];
  transcriptData.forEach(module => {
    if (
      module.semester === semester &&
      module.reportNo === reportNo &&
      !module.transferSeq
    )
      modules.push(translateModule(module));
  });
  if (modules.length > 0) return modules;
  return null;
};

// construct a JSON of transcript data with nested structure.
// The returned JSON will be the data source of TranscriptTermData
const translateTranscriptTermData = dataSource => {
  if (!dataSource.transcriptRaw)
    dataSource.transcriptRaw = dataSource.transcript;
  // find first term(s). Two for CDP and one for others
  let currentReportNo = 0;
  dataSource.additionalData.transcriptGroup.forEach((term, termIdx) => {
    if (currentReportNo !== term.reportNo) {
      currentReportNo = term.reportNo;
      firstTermIdxes.push(termIdx);
    }
    // group credit transfers by term
    if (term.creditTransfer)
      term.creditTransfer.forEach(transfer => {
        transfer.details = getCreditTransferDetails(
          dataSource.transcriptRaw,
          term.name,
          term.reportNo,
          transfer.transferSeq
        );
      });
    // group enrolmet data by term
    const enrolmentModules = getEnrolmentModules(
      dataSource.transcriptRaw,
      term.name,
      term.reportNo
    );
    if (enrolmentModules) term.modules = enrolmentModules;
  });
  dataSource.transcript = dataSource.additionalData.transcriptGroup;
};

// transcript term data - nested structure
class TranscriptTermData {
  // constructor
  constructor(termData, termIdx, dataFeeder) {
    this.termData = termData;
    this.termIdx = termIdx;
    this.dataFeeder = dataFeeder;
  }

  // main render
  render() {
    // NOTE: all term data rows should have a type starting with "ts-term"
    this.renderAcadYear();
    if (!isMedDen) this.renderFormOfStudy();
    this.renderCreditTransfer();
    this.renderEnrollment();
    this.renderTermSummary();
    this.renderTermRemarks();
  }

  // render academic year
  renderAcadYear() {
    // acad year can't be last row
    this.dataFeeder.push(
      "ts-term-year",
      <td colSpan="4" className={cls("ts-title ts-highlight")}>
        <p />
        ACADEMIC YEAR {this.termData.term.toUpperCase()}
        <p />
      </td>,
      true
    );
  }

  // render form of study description
  renderFormOfStudy() {
    if (this.fosPrintArea !== "ND" && this.termData.fosDescription) {
      this.dataFeeder.push(
        "ts-term-fos",
        <td colSpan="4" className={cls("ts-termrem")}>
          {`${this.termData.fosDescription.toUpperCase()} ${this.termData.organization
              ? this.termData.organization.toUpperCase()
              : ""
            }`}
        </td>
      );
    }
  }

  // render credit transfer data
  renderCreditTransfer() {
    new TranscriptCreditTransfer(
      this.termData,
      this.termIdx,
      this.dataFeeder
    ).render();
  }

  // render module enrollment data
  renderEnrollment() {
    new TranscriptEnrollment(this.termData, this.dataFeeder).render();
  }

  // render term summary info
  renderTermSummary() {
    new TranscriptSummary(this.termData, this.dataFeeder).render();
  }

  // render term remarks
  renderTermRemarks() {
    new TranscriptTermRemarks(this.termData, this.dataFeeder).render();
  }
}

// render student LOA data
class TranscriptLeave {
  // constructor
  constructor(leaveData, dataFeeder) {
    this.leaveData = leaveData;
    this.dataFeeder = dataFeeder;
  }

  // main render
  render() {
    if (this.leaveData) {
      this.leaveData.forEach((data, idx) => {
        this.renderLeave(data, idx);
      });
    }
  }

  // render leave data
  renderLeave(data, idx) {
    let text = `LEAVE OF ABSENCE FROM ${isoDateToLocal(data.from)}`;
    if (data.to) text += ` TO ${isoDateToLocal(data.to)}`;
    if (idx === 0)
      // print a line before 1st row
      this.dataFeeder.push(
        "ts-loa",
        <td colSpan="4" className={cls("ts-title ts-highlight")}>
          <hr />
          {text}
        </td>
      );
    else
      this.dataFeeder.push(
        "ts-loa",
        <td colSpan="4" className={cls("ts-title ts-highlight")}>
          {text}
        </td>
      );
  }
}

// render degree conferment
class TranscriptDegree {
  // constructor
  constructor(degreeData, dataFeeder) {
    this.degreeData = degreeData;
    this.dataFeeder = dataFeeder;
  }

  // main render
  render() {
    if (this.degreeData) {
      this.renderDegreeInfoTitle();
      this.degreeData.forEach(data => {
        this.renderDegree(data);
      });
    }
  }

  // render degree info beginning title
  renderDegreeInfoTitle() {
    this.dataFeeder.push(
      "ts-deg-begin",
      <td colSpan="4" className={cls("ts-title ts-highlight")}>
        <hr />
        CONFERRED/AWARDED THE DEGREE(S)/DIPLOMA(S) OF:
      </td>
    );
  }

  // render major/minor
  renderMajorMinor(data) {
    if (data.plans) {
      let descr;
      data.plans.forEach(planData => {
        if (!planData.specialProgram) {
          if (planData.type === "HON")
            descr = `MAJOR: ${planData.transcriptDescr}`;
          else descr = `${planData.typeName}: ${planData.transcriptDescr}`;
          if (planData.type === "JMP" && planData.planDescr)
            descr += ` with ${planData.planDescr}`;
          this.dataFeeder.push(
            "ts-deg-plan",
            <td
              colSpan="4"
              className={cls("ts-title ts-highlight")}
              style={{ paddingLeft: "20px" }}
            >
              {descr.toUpperCase()}
            </td>
          );
        }
      });
    }
  }

  // render subplans
  renderSubplans(data) {
    if (data.plans) {
      let descr;
      data.plans.forEach(planData => {
        if (planData.subplans)
          planData.subplans.forEach(subplData => {
            descr = `${subplData.typeName}: ${subplData.transcriptDescr}`;
            this.dataFeeder.push(
              "ts-deg-spln",
              <td
                colSpan="4"
                className={cls("ts-title ts-highlight")}
                style={{ paddingLeft: "20px" }}
              >
                {descr.toUpperCase()}
              </td>
            );
          });
      });
    }
  }

  // render specializations
  renderSpecializations(data) {
    if (data.specializations) {
      let descr;
      data.specializations.forEach(splData => {
        descr = `${splData.typeName}: ${splData.transcriptDescr}`;
        this.dataFeeder.push(
          "ts-deg-spcl",
          <td
            colSpan="4"
            className={cls("ts-title ts-highlight")}
            style={{ paddingLeft: "20px" }}
          >
            {descr.toUpperCase()}
          </td>
        );
      });
    }
  }

  // render degree
  renderDegree(data) {
    let degTitle = data.degreeTitle.toUpperCase();
    if (data.honours) {
      if (data.isYNC) degTitle += `, ${data.honours}`;
      else degTitle += ` with ${data.honours}`;
    }
    this.dataFeeder.push(
      "ts-deg-title",
      <td
        colSpan="4"
        className={cls("ts-title ts-highlight")}
        style={{ paddingLeft: "10px" }}
      >
        {degTitle.toUpperCase()}
      </td>
    );
    this.renderMajorMinor(data);
    this.renderSubplans(data);
    this.renderSpecializations(data);
  }
}

// render milestones
class TranscriptMilestone {
  // constructor
  constructor(msData, dataFeeder) {
    this.msData = msData;
    this.dataFeeder = dataFeeder;
  }

  // main render
  render() {
    if (this.msData) {
      this.msData.forEach(data => {
        if (data.milestoneTitle) {
          const descr = `${isNG ? "Completed a research project on" : data.milestoneTitle
            } ${data.thesisTitle}`;
          // blank line
          if (isRev2021)
            this.dataFeeder.push(
              "ts-blank",
              <td colSpan="4" className={cls("ts-blank")}>
                &nbsp;
              </td>
            );
          this.dataFeeder.push(
            "ts-ms",
            <td
              colSpan="4"
              className={cls("ts-title ts-highlight")}
              style={{ paddingLeft: isRev2021 ? "0px" : "20px" }}
            >
              {descr.toUpperCase()}
            </td>
          );
        }
      });
    }
  }
}

// render special programs
class TranscriptSpclProg {
  // constructor
  constructor(degreeData, dataFeeder) {
    this.degreeData = degreeData;
    this.dataFeeder = dataFeeder;
  }

  // main render
  render() {
    if (this.degreeData) {
      this.degreeData.forEach(data => {
        if (data.plans)
          data.plans.forEach(planData => {
            if (planData.specialProgram) {
              // blank line
              if (isRev2021)
                this.dataFeeder.push(
                  "ts-blank",
                  <td colSpan="4" className={cls("ts-blank")}>
                    &nbsp;
                  </td>
                );
              let descr = planData.transcriptDescr;
              if (planData.planDescr) descr += ` ${planData.planDescr}`;
              this.dataFeeder.push(
                "ts-splprg",
                <td
                  colSpan="4"
                  className={cls("ts-title ts-highlight")}
                  style={{ paddingLeft: isRev2021 ? "0px" : "10px" }}
                >
                  {descr.toUpperCase()}
                </td>
              );
            }
          });
      });
    }
  }
}

// render awards
class TranscriptAward {
  // constructor
  constructor(awardData, dataFeeder) {
    this.awardData = awardData;
    this.dataFeeder = dataFeeder;
  }

  // main render
  render() {
    if (this.awardData) {
      this.renderAwardHeader();
      this.renderAwardDetails();
    }
  }

  // render award header
  renderAwardHeader() {
    this.dataFeeder.push(
      "ts-awd-head",
      <td colSpan="4" className={cls("ts-title ts-highlight")}>
        <hr />
        AWARDS:
      </td>
    );
  }

  renderAwardDetails() {
    const clsNames = isRev2021
      ? "ts-title awd-col2"
      : "ts-title ts-highlight awd-col2";
    this.awardData.forEach(data => {
      this.dataFeeder.push(
        "ts-awd-l1",
        <td colSpan="4" style={{ paddingTop: "0", paddingBottom: "0" }}>
          <div className={cls("awd-col0")} />
          <div className={cls("ts-title ts-highlight awd-col1")}>
            {`${data.year.toUpperCase()}:`}
          </div>
          <div colSpan="2" className={cls(clsNames)}>
            {data.name.toUpperCase()}
          </div>
        </td>
      );
      this.dataFeeder.push(
        "ts-awd-l2",
        <td colSpan="4" style={{ paddingTop: "0", paddingBottom: "0" }}>
          <div className={cls("awd-col0")} />
          <div className={cls("awd-col1")}>&nbsp;</div>
          <div colSpan="2" className={cls(clsNames)}>
            ({data.basis.toUpperCase()})
          </div>
        </td>
      );
    });
  }
}

// transcript data
class TranscriptData {
  // constructor
  constructor(dataSource, dataFeeder) {
    this.dataSource = dataSource;
    this.dataFeeder = dataFeeder;
  }

  // main render
  render() {
    // render transcript term data
    // build for each term, termIdx is used to identify 1st term
    this.dataSource.transcript.forEach((termData, termIdx) => {
      new TranscriptTermData(termData, termIdx, this.dataFeeder).render();
    });
    // render disciplinary remarks
    this.renderDisciplinaryRemarks();
    // render LOA data
    new TranscriptLeave(
      this.dataSource.additionalData.leaveData,
      this.dataFeeder
    ).render();
    if (!isRev2021) {
      // render degree data
      new TranscriptDegree(
        this.dataSource.additionalData.degreeData,
        this.dataFeeder
      ).render();
      // render milestone data
      new TranscriptMilestone(
        this.dataSource.additionalData.milestoneData,
        this.dataFeeder
      ).render();
      // render special program data
      new TranscriptSpclProg(
        this.dataSource.additionalData.degreeData,
        this.dataFeeder
      ).render();
      this.renderConferDate();
      this.renderDegreeRemarks();
      // render award data
      new TranscriptAward(
        this.dataSource.additionalData.awardData,
        this.dataFeeder
      ).render();
    }
    // render disciplinary remarks
    this.renderDismissalRemarks();
    // end of transcript
    this.renderTranscriptEnd();
  }

  // render conferment date
  renderConferDate() {
    const { degreeData } = this.dataSource.additionalData;
    if (degreeData) {
      const date = isoDateToLocal(degreeData[0].dateConferred);
      this.dataFeeder.push(
        "ts-confdt",
        <td colSpan="4" className={cls("ts-title ts-highlight")}>
          CONFERMENT DATE: {date}
        </td>
      );
    }
  }

  // render disciplinary remarks
  renderDisciplinaryRemarks() {
    const remarksData = this.dataSource.additionalData.disciplinaryRemarks;
    if (remarksData) {
      this.dataFeeder.push(
        "ts-degrem",
        <td colSpan="4">
          <hr />
        </td>
      );
      remarksData.forEach(line => {
        this.dataFeeder.push(
          "ts-degrem",
          <td colSpan="4" className={cls("ts-title ts-highlight")}>
            {line.trim().toUpperCase()}
          </td>
        );
      });
      this.dataFeeder.push(
        "ts-degrem",
        <td colSpan="4" className={cls("ts-title")}>
          {
            "(STUDENT RECORDS ARE AVAILABLE UPON REQUEST AND WITH STUDENT'S CONSENT)"
          }
        </td>
      );
    }
  }

  // render dismissal remarks
  renderDismissalRemarks() {
    const remarksData = this.dataSource.additionalData.dismissalRemarks;
    if (remarksData) {
      this.dataFeeder.push(
        "ts-degrem",
        <td colSpan="4">
          <hr />
        </td>
      );
      remarksData.forEach(line => {
        this.dataFeeder.push(
          "ts-degrem",
          <td colSpan="4" className={cls("ts-title ts-highlight")}>
            {line.trim().toUpperCase()}
          </td>
        );
      });
      if (toDisplayDismissalRemarks) {
        this.dataFeeder.push(
          "ts-degrem",
          <td colSpan="4" className={cls("ts-title")}>
            {
              "(STUDENT RECORDS ARE AVAILABLE UPON REQUEST AND WITH STUDENT'S CONSENT)"
            }
          </td>
        );
      }
    }
  }

  // render final remarks
  renderDegreeRemarks() {
    const remarksData = this.dataSource.additionalData.remarks;
    if (remarksData) {
      let text = "";
      remarksData.forEach(line => {
        text += `${line.trim()} `;
      });
      this.dataFeeder.push(
        "ts-degrem",
        <td colSpan="4" className={cls("ts-title ts-highlight")}>
          {text}
        </td>
      );
    }
  }

  // render end of transcript
  renderTranscriptEnd() {
    const line = "*".repeat(50);
    this.dataFeeder.push(
      "ts-end",
      <td colSpan="4" className={cls("ts-text")} align="center">
        {line}END OF TRANSCRIPT{line}
      </td>
    );
  }
}

// ========================================
// revamp 2021 starts here
// ========================================
// transcript content - conferment info introduced for revamped format (2021)
class TranscriptConfermentRev2021 {
  constructor(dataSource, dataFeeder) {
    this.dataSource = dataSource;
    this.dataFeeder = dataFeeder;
  }

  // main render
  render() {
    // render degree data
    new TranscriptDegreeRev2021(
      this.dataSource.additionalData.degreeData,
      this.dataFeeder
    ).render();
    // render milestone
    new TranscriptMilestone(
      this.dataSource.additionalData.milestoneData,
      this.dataFeeder
    ).render();
    // render special programs
    new TranscriptSpclProg(
      this.dataSource.additionalData.degreeData,
      this.dataFeeder
    ).render();
    // render transcript remarks
    this.renderDegreeRemarks();
    // render award data
    new TranscriptAward(
      this.dataSource.additionalData.awardData,
      this.dataFeeder
    ).render();
    // line
    this.dataFeeder.push(
      "ts-confer-end",
      <td colSpan="4">
        <hr />
      </td>
    );
  }

  // render final remarks
  renderDegreeRemarks() {
    const remarksData = this.dataSource.additionalData.remarks;
    if (remarksData) {
      // blank line
      this.dataFeeder.push(
        "ts-blank",
        <td colSpan="4" className={cls("ts-blank")}>
          &nbsp;
        </td>
      );
      let text = "";
      remarksData.forEach(line => {
        text += `${line.trim()} `;
      });
      this.dataFeeder.push(
        "ts-degrem",
        <td colSpan="4" className={cls("ts-title ts-highlight")}>
          {text.toUpperCase()}
        </td>
      );
    }
  }
}
// render degree conferment - revamped 2021
class TranscriptDegreeRev2021 {
  // constructor
  constructor(degreeData, dataFeeder) {
    this.degreeData = degreeData;
    this.dataFeeder = dataFeeder;
  }

  // main render
  render() {
    if (this.degreeData) {
      this.degreeData.forEach((data, idx) => {
        this.renderDegree(data, idx);
      });
    }
  }

  // render major/minor - revamped 2021
  renderMajorMinor(data) {
    if (data.plans) {
      let planName;
      let planDescr;
      data.plans.forEach(planData => {
        if (!planData.specialProgram) {
          if (planData.type === "HON") {
            planName = "MAJOR";
            planDescr = planData.transcriptDescr;
          } else {
            planName = planData.typeName;
            planDescr = planData.transcriptDescr;
          }
          if (planData.type === "JMP" && planData.planDescr)
            planDescr += ` with ${planData.planDescr}`;
          this.dataFeeder.push(
            "ts-deg-plan",
            <td colSpan="4" style={{ paddingTop: "0", paddingBottom: "0" }}>
              <div
                colSpan="2"
                className={cls("ts-title ts-highlight confer-col0")}
              >
                {planName.toUpperCase()}:
              </div>
              <div colSpan="2" className={cls("ts-title confer-col1")}>
                {planDescr.toUpperCase()}
              </div>
            </td>
          );
        }
      });
    }
  }

  // render subplans - revamped 2021
  renderSubplans(data) {
    if (data.plans) {
      data.plans.forEach(planData => {
        if (planData.subplans)
          planData.subplans.forEach(subplData => {
            this.dataFeeder.push(
              "ts-deg-spln",
              <td colSpan="4" style={{ paddingTop: "0", paddingBottom: "0" }}>
                <div
                  colSpan="2"
                  className={cls("ts-title ts-highlight confer-col0")}
                >
                  {subplData.typeName.toUpperCase()}:
                </div>
                <div colSpan="2" className={cls("ts-title confer-col1")}>
                  {subplData.transcriptDescr.toUpperCase()}
                </div>
              </td>
            );
          });
      });
    }
  }

  // render specializations - revamped 2021
  renderSpecializations(data) {
    if (data.specializations) {
      data.specializations.forEach(splData => {
        this.dataFeeder.push(
          "ts-deg-spcl",
          <td colSpan="4" style={{ paddingTop: "0", paddingBottom: "0" }}>
            <div
              colSpan="2"
              className={cls("ts-title ts-highlight confer-col0")}
            >
              {splData.typeName.toUpperCase()}:
            </div>
            <div colSpan="2" className={cls("ts-title confer-col1")}>
              {splData.transcriptDescr.toUpperCase()}
            </div>
          </td>
        );
      });
    }
  }

  // render degree - revamped 2021
  renderDegree(data, idx) {
    // blank line
    if (idx > 0)
      this.dataFeeder.push(
        "ts-blank",
        <td colSpan="4" className={cls("ts-blank")}>
          &nbsp;
        </td>
      );
    let degTitle = data.degreeTitle.toUpperCase();
    if (data.honours) {
      if (data.isYNC) degTitle += `, ${data.honours}`;
      else degTitle += ` with ${data.honours}`;
    }
    // degree title
    this.dataFeeder.push(
      "ts-deg-title",
      <td colSpan="4" style={{ paddingTop: "0", paddingBottom: "0" }}>
        <div colSpan="2" className={cls("ts-title ts-highlight confer-col0")}>
          {data.isDiploma ? "DIPLOMA AWARDED" : "DEGREE CONFERRED:"}
        </div>
        <div colSpan="2" className={cls("ts-title confer-col1")}>
          {degTitle.toUpperCase()}
        </div>
      </td>
    );
    // CAP
    this.dataFeeder.push(
      "ts-deg-cap",
      <td colSpan="4" style={{ paddingTop: "0", paddingBottom: "0" }}>
        <div colSpan="2" className={cls("ts-title ts-highlight confer-col0")}>
          {data.GPAName.toUpperCase() === "FINAL CUMULATIVE AVERAGE POINT"
            ? "FINAL CAP"
            : data.GPAName.toUpperCase()}
          {":"}
        </div>
        <div colSpan="2" className={cls("ts-title confer-col1")}>
          {data.includeInGPA && !data.disableGPA
            ? data.cumGPA.toFixed(2)
            : "NOT APPLICABLE"}
        </div>
      </td>
    );
    // YNC commensurate info
    if (data.isYNC) {
      const remarks = yncCommensurateRemark(data.cumGPA);
      if (remarks)
        this.dataFeeder.push(
          "ts-deg-yncrem",
          <td colSpan="4" style={{ paddingTop: "0", paddingBottom: "0" }}>
            <div
              colSpan="2"
              className={cls("ts-title ts-highlight confer-col0")}
            >
              &nbsp;
            </div>
            <div colSpan="2" className={cls("ts-title confer-col1")}>
              {remarks}
            </div>
          </td>
        );
    }
    // cumulative module credits
    if (data.cumCredits)
      this.dataFeeder.push(
        "ts-deg-mc",
        <td colSpan="4" style={{ paddingTop: "0", paddingBottom: "0" }}>
          <div colSpan="2" className={cls("ts-title ts-highlight confer-col0")}>
            CUMULATIVE {modcreditstoUnits}:
          </div>
          <div colSpan="2" className={cls("ts-title confer-col1")}>
            {data.cumCredits.toFixed(2)}
          </div>
        </td>
      );
    // admission date
    this.dataFeeder.push(
      "ts-deg-admitdt",
      <td colSpan="4" style={{ paddingTop: "0", paddingBottom: "0" }}>
        <div colSpan="2" className={cls("ts-title ts-highlight confer-col0")}>
          ADMISSION DATE:
        </div>
        <div colSpan="2" className={cls("ts-title confer-col1")}>
          {isoDateToLocal(data.dateAdmitted)}
        </div>
      </td>
    );
    // conferment date
    this.dataFeeder.push(
      "ts-deg-confdt",
      <td colSpan="4" style={{ paddingTop: "0", paddingBottom: "0" }}>
        <div colSpan="2" className={cls("ts-title ts-highlight confer-col0")}>
          {data.isDiploma ? "AWARD DATE" : "CONFERMENT DATE:"}
        </div>
        <div colSpan="2" className={cls("ts-title confer-col1")}>
          {isoDateToLocal(data.dateConferred)}
        </div>
      </td>
    );
    this.renderMajorMinor(data);
    this.renderSubplans(data);
    this.renderSpecializations(data);
  }
}
// ========================================
// revamp 2021 ends here
// ========================================

// ========================================
// render
const Template = ({ certificate }) => {
  // JSON data source
  const jsonData = certificate;
  //Terminology Change wef Aug 2023
    CAPtoGPA = jsonData.issuedOn >= termsChangeCutoffDate2023 ? `GPA` : `CAP`;
    CAPtoGPAlong = jsonData.issuedOn >= termsChangeCutoffDate2023 ? `GRADE POINT AVERAGE` : `CUMULATIVE AVERAGE POINT`;
    moduletoCourse = jsonData.issuedOn >= termsChangeCutoffDate2023 ? `COURSE` : `MODULE`;
    modcreditstoUnits = jsonData.issuedOn >= termsChangeCutoffDate2023 ? `UNITS` : `MODULAR CREDITS`;
    creditsTounits = jsonData.issuedOn >= termsChangeCutoffDate2023 ? `UNITS` : `CREDITS`;

  // translate
  if (jsonData.additionalData.transcriptGroup)
    translateTranscriptTermData(jsonData);
  if (firstTermIdxes.length === 0) firstTermIdxes.push(0);
  // to be used in rendering
  isUG = jsonData.additionalData.transcriptType.startsWith("UG");
  isGD = jsonData.additionalData.transcriptType.startsWith("GD");
  isDuke = jsonData.additionalData.transcriptType.startsWith("DK");
  isCDP = jsonData.additionalData.transcriptType.startsWith("CDP");
  isMedDen =
    jsonData.additionalData.transcriptType.startsWith("UM") ||
    jsonData.additionalData.transcriptType.startsWith("UD");
  isOfficial = jsonData.additionalData.transcriptType.endsWith("OF");
  isConferred = !!jsonData.additionalData.degreeData;
  isRev2021 =
    (isUG || isGD) &&
    isOfficial &&
    isConferred &&
    jsonData.issuedOn >= revCutOffDate2021;
  toDisplayDismissalRemarks = jsonData.issuedOn >= dismissalRemarksCutOffDate;
  [isYaleNUS, progNameYaleNUS] = (transcriptData => {
    const programData = transcriptData.additionalData.programData;
    if (programData)
      for (let i = 0; i < programData.length; i += 1)
        if (
          programData[i].isYNC ||
          programData[i].programCode.substring(1, 3) === "17"
        )
          // `isYNC` is applicable to UGRD students
          return [true, programData[i].programName];
    return [false, null];
  })(jsonData);
  isNG = jsonData.additionalData.transcriptType.startsWith("NG");
  // check if degree scroll exists  
  isDegreeScroll = typeof jsonData !== "undefined" && jsonData.additionalData && typeof jsonData.additionalData.degreeScroll !== "undefined";
  // check degree scroll if applicable   
    if (isDegreeScroll) {
        const firstDegree = jsonData.additionalData.degreeScroll[0];
        if (firstDegree.type && firstDegree.type.includes("YALE")) {
            isYALENUSDegree = true;
        }
    }
  // to be used for Yale-NUS last term remarks, only applicable when conferred
  lastTermYaleNUS = (transcriptData => {
    let lastTerm = null;
    if (isYaleNUS) {
      let conferredYNC = false;
      const degreeData = transcriptData.additionalData.degreeData;
      // find Yale-NUS program name and last term
      if (degreeData)
        for (let i = 0; i < degreeData.length; i += 1)
          if (degreeData[i].isYNC) {
            conferredYNC = true;
            break;
          }
      if (conferredYNC)
        transcriptData.additionalData.transcriptGroup.forEach(term => {
          if (term.summary)
            term.summary.forEach(summary => {
              if (summary.programName === progNameYaleNUS) lastTerm = term.name;
            });
        });
    }
    return lastTerm;
  })(jsonData);
  // prepare data
  const dataFeeder = new TranscriptDataFeeder();
  dataFeeder.headerData = renderTranscriptHeaderData(jsonData);
  if (isRev2021)
    // revamped format - 2021
    new TranscriptConfermentRev2021(jsonData, dataFeeder).render();
  // original format
  else new TranscriptProgram(jsonData, dataFeeder).render();
  new TranscriptData(jsonData, dataFeeder).render();
  dataFeeder.resetTermRange("ts-term");
  // render data
  // 1123px is width of A4 portrait (29.7cm)
  const ratio = (window.innerWidth - 30) / 1123;
  const scale =
    ratio < 1
      ? {
        transform: `scale(${ratio}, ${ratio})`,
        transformOrigin: "top left"
      }
      : null;
  let legend;
  if (jsonData.issuedOn >= termsChangeCutoffDate2023) {
      if (isDuke) {
          if (jsonData.issuedOn >= newLegendDuke2026) {
              legend = NUS_TS_LEGEND_DUKE_2026;
          } else {
              legend = NUS_TS_LEGEND_DUKE_2023;
          }
      }
      else if (isDegreeScroll ? (isYaleNUS && isYALENUSDegree) : isYaleNUS) legend = NUS_TS_LEGEND_YALE_2023;
      else if (jsonData.issuedOn >= newAppointmentCutoffDate2024) {
          if (jsonData.issuedOn >= newLegend2026) {
              legend = NUS_TS_LEGEND_2026;
          } else {
              legend = NUS_TS_LEGEND_2024;
          }
      } else { legend = NUS_TS_LEGEND_2023; }
    } else {
        if (isDuke) legend = NUS_TS_LEGEND_DUKE;
        else if (isDegreeScroll ? (isYaleNUS && isYALENUSDegree) : isYaleNUS) legend = NUS_TS_LEGEND_YALE;
        else legend = NUS_TS_LEGEND;
    }
  const backImgUrl = `url(${(isDegreeScroll ? (isYaleNUS && isYALENUSDegree) : isYaleNUS) ? NUS_TS_BACKIMG_YALE : NUS_TS_BACKIMG})`;
  const backgroundImg = {
    backgroundImage: backImgUrl,
    backgroundSize: "1140px 806px", // width height
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center center" // horizontal vertical
  };
  const html = (
    <div style={scale}>
      <Transcript
        maxPages="8"
        maxRows="40"
        dataFeeder={dataFeeder}
        background={backgroundImg}
        legendPage={legend}
        legendRatio="0.95"
      />
    </div>
  );
  return html;
};
export default Template;
Template.propTypes = {
  certificate: PropTypes.object.isRequired
};
