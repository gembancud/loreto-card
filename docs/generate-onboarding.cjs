const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, LevelFormat } = require('docx');
const fs = require('fs');

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 56, bold: true, color: "000000", font: "Arial" },
        paragraph: { spacing: { before: 0, after: 240 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: "1a365d", font: "Arial" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: "2c5282", font: "Arial" },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-1", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullet-2", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullet-3", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullet-4", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullet-5", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullet-6", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullet-7", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-1", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children: [
      // Title
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("LoreCard System")] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 480 },
        children: [new TextRun({ text: "Client Onboarding Guide", size: 28, italics: true })] }),

      // Introduction
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Introduction")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("LoreCard is a digital benefit and voucher management system designed for the Municipality of Loreto, Philippines. The system enables government departments to distribute benefits to residents in a transparent, accountable, and efficient manner.")
      ]}),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("The primary goals of LoreCard are:")
      ]}),
      new Paragraph({ numbering: { reference: "bullet-1", level: 0 }, children: [new TextRun("Ensure transparent distribution of government benefits to residents")] }),
      new Paragraph({ numbering: { reference: "bullet-1", level: 0 }, children: [new TextRun("Maintain accountability through built-in separation of duties")] }),
      new Paragraph({ numbering: { reference: "bullet-1", level: 0 }, children: [new TextRun("Create a complete audit trail for all benefit distributions")] }),
      new Paragraph({ numbering: { reference: "bullet-1", level: 0 }, spacing: { after: 200 }, children: [new TextRun("Enable each department to manage their own benefit programs independently")] }),

      // People Records
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("People Records")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("At the heart of LoreCard are the people - the residents and beneficiaries of Loreto who receive government benefits. The system maintains records for each resident to ensure benefits reach the right people.")
      ]}),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("What Information is Stored")] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun("Each person's record includes:")] }),
      new Paragraph({ numbering: { reference: "bullet-2", level: 0 }, children: [new TextRun("Full name (first name, middle name, last name, and suffix if applicable)")] }),
      new Paragraph({ numbering: { reference: "bullet-2", level: 0 }, children: [new TextRun("Complete address (purok, barangay)")] }),
      new Paragraph({ numbering: { reference: "bullet-2", level: 0 }, children: [new TextRun("Date of birth and gender")] }),
      new Paragraph({ numbering: { reference: "bullet-2", level: 0 }, children: [new TextRun("Contact information (phone number)")] }),
      new Paragraph({ numbering: { reference: "bullet-2", level: 0 }, spacing: { after: 200 }, children: [new TextRun("Profile photo for identification")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Government Service Registrations")] }),
      new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun("The system also tracks which government programs a resident is registered with. This helps determine eligibility for certain benefits and provides a complete picture of the support each resident receives:")
      ]}),
      new Paragraph({ numbering: { reference: "bullet-3", level: 0 }, children: [new TextRun("PhilHealth (national health insurance)")] }),
      new Paragraph({ numbering: { reference: "bullet-3", level: 0 }, children: [new TextRun("SSS (Social Security System)")] }),
      new Paragraph({ numbering: { reference: "bullet-3", level: 0 }, children: [new TextRun("GSIS (Government Service Insurance System)")] }),
      new Paragraph({ numbering: { reference: "bullet-3", level: 0 }, children: [new TextRun("4Ps / Pantawid Pamilyang Pilipino Program")] }),
      new Paragraph({ numbering: { reference: "bullet-3", level: 0 }, children: [new TextRun("PWD (Persons with Disability) registration")] }),
      new Paragraph({ numbering: { reference: "bullet-3", level: 0 }, spacing: { after: 200 }, children: [new TextRun("Solo Parent registration")] }),

      // Benefits
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Benefits")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("A benefit represents a program or type of assistance that a department offers to residents. Each department creates and manages its own benefits based on its mandate and available resources.")
      ]}),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Examples of Benefits")] }),
      new Paragraph({ numbering: { reference: "bullet-4", level: 0 }, children: [new TextRun("Financial assistance programs")] }),
      new Paragraph({ numbering: { reference: "bullet-4", level: 0 }, children: [new TextRun("Health and medical support")] }),
      new Paragraph({ numbering: { reference: "bullet-4", level: 0 }, children: [new TextRun("Educational assistance")] }),
      new Paragraph({ numbering: { reference: "bullet-4", level: 0 }, children: [new TextRun("Livelihood programs")] }),
      new Paragraph({ numbering: { reference: "bullet-4", level: 0 }, children: [new TextRun("Senior citizen benefits")] }),
      new Paragraph({ numbering: { reference: "bullet-4", level: 0 }, spacing: { after: 200 }, children: [new TextRun("Emergency relief")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Benefit Configuration")] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun("Each benefit has:")] }),
      new Paragraph({ numbering: { reference: "bullet-5", level: 0 }, children: [new TextRun("A name and description")] }),
      new Paragraph({ numbering: { reference: "bullet-5", level: 0 }, children: [new TextRun("Optional monetary value or quantity")] }),
      new Paragraph({ numbering: { reference: "bullet-5", level: 0 }, spacing: { after: 200 }, children: [new TextRun("Assigned staff members who can issue and release vouchers for that benefit")] }),

      // Voucher Lifecycle
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("The Voucher Lifecycle")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("A voucher is a record of a specific benefit being given to a specific person. It represents one instance of benefit distribution. The voucher system is designed with built-in accountability measures.")
      ]}),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Step 1: Issuing a Voucher (Provider)")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("When a resident is to receive a benefit, a staff member called the "),
        new TextRun({ text: "Provider", bold: true }),
        new TextRun(" creates a voucher. This records that the benefit should be given to the resident. At this point, the voucher is in a "),
        new TextRun({ text: "\"Pending\"", bold: true }),
        new TextRun(" state - it has been issued but not yet released.")
      ]}),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Step 2: Releasing a Voucher (Releaser)")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("A different staff member called the "),
        new TextRun({ text: "Releaser", bold: true }),
        new TextRun(" must then confirm and authorize the benefit. Once released, the voucher status changes to "),
        new TextRun({ text: "\"Released\"", bold: true }),
        new TextRun(" and the benefit distribution is complete.")
      ]}),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Separation of Duties: Why Two People?")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun({ text: "The requirement that the Provider and Releaser must be different people is a critical accountability measure.", italics: true }),
        new TextRun(" This separation of duties:")
      ]}),
      new Paragraph({ numbering: { reference: "numbered-1", level: 0 }, children: [new TextRun({ text: "Prevents fraud", bold: true }), new TextRun(" - No single person can complete a benefit distribution alone")] }),
      new Paragraph({ numbering: { reference: "numbered-1", level: 0 }, children: [new TextRun({ text: "Ensures verification", bold: true }), new TextRun(" - A second person must review and confirm each transaction")] }),
      new Paragraph({ numbering: { reference: "numbered-1", level: 0 }, children: [new TextRun({ text: "Creates accountability", bold: true }), new TextRun(" - Two staff members are responsible for every voucher")] }),
      new Paragraph({ numbering: { reference: "numbered-1", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Maintains integrity", bold: true }), new TextRun(" - The system automatically enforces this requirement")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Cancellation")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("If a voucher was issued by mistake or is no longer needed, it can be cancelled while still in the Pending state. Once a voucher has been released, it cannot be cancelled as the benefit has already been distributed.")
      ]}),

      // User Roles
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("User Roles")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("LoreCard has three levels of user access, each with different capabilities:")
      ]}),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Superuser")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("Superusers have full administrative access across the entire system. They can view and manage all departments, all users, and all data. This role is typically reserved for IT administrators or senior municipal officials responsible for system-wide oversight.")
      ]}),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Admin")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("Admins manage their own department. They can create and configure benefits for their department, assign staff members to specific benefits, and view reports for their department's activities. Admins cannot see or modify data from other departments.")
      ]}),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("User")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("Users are the staff members who work with vouchers on a daily basis. They can issue vouchers (act as Provider) and release vouchers (act as Releaser) for the benefits they have been assigned to. Users can only work with benefits they have been explicitly assigned to by their department's Admin.")
      ]}),

      // Department Scope
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Department Scope")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("LoreCard is designed to support the organizational structure of municipal government. Each department operates independently within the system:")
      ]}),
      new Paragraph({ numbering: { reference: "bullet-6", level: 0 }, children: [new TextRun("Each department manages its own benefits and staff assignments")] }),
      new Paragraph({ numbering: { reference: "bullet-6", level: 0 }, children: [new TextRun("Department data is kept separate - one department cannot see another's vouchers or beneficiary records")] }),
      new Paragraph({ numbering: { reference: "bullet-6", level: 0 }, children: [new TextRun("Statistics and reports are scoped to the department level")] }),
      new Paragraph({ numbering: { reference: "bullet-6", level: 0 }, spacing: { after: 200 }, children: [new TextRun("This ensures data privacy and allows departments to operate autonomously")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("The system currently supports 16 municipal departments, including offices such as the Mayor's Office, Municipal Social Welfare and Development, Municipal Health Office, Municipal Agriculture Office, and others.")
      ]}),

      // Audit Trail
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Audit Trail")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("Every action in LoreCard is recorded for complete accountability. The audit trail ensures that all benefit distributions can be reviewed and verified.")
      ]}),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("What is Recorded")] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun("For every voucher, the system automatically records:")] }),
      new Paragraph({ numbering: { reference: "bullet-7", level: 0 }, children: [new TextRun("Who issued the voucher (Provider) and when")] }),
      new Paragraph({ numbering: { reference: "bullet-7", level: 0 }, children: [new TextRun("Who released the voucher (Releaser) and when")] }),
      new Paragraph({ numbering: { reference: "bullet-7", level: 0 }, children: [new TextRun("The beneficiary who received the benefit")] }),
      new Paragraph({ numbering: { reference: "bullet-7", level: 0 }, children: [new TextRun("The specific benefit that was distributed")] }),
      new Paragraph({ numbering: { reference: "bullet-7", level: 0 }, spacing: { after: 200 }, children: [new TextRun("Any cancellation actions and who performed them")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("This comprehensive record-keeping supports transparency, enables auditing, and provides documentation for any questions about benefit distributions.")
      ]}),

      // Closing
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Summary")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("LoreCard provides a structured, accountable system for distributing government benefits to residents of Loreto. By maintaining detailed people records, managing benefits at the department level, enforcing separation of duties through the Provider-Releaser workflow, and keeping complete audit trails, the system ensures that benefit distribution is transparent, verifiable, and fair.")
      ]}),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/gem/git/jsts/loretocard/docs/LoreCard-Onboarding.docx", buffer);
  console.log("Document created: docs/LoreCard-Onboarding.docx");
});
