import io
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
    KeepTogether,
    Table,
    TableStyle
)

class AtsPdfGenerator:
    """
    Generates an ATS-compliant, single-column, cleanly structured PDF resume
    with selectable text and standard section headers.
    """

    @classmethod
    def generate(cls, resume_data: dict, output_stream_or_path=None):
        buffer = output_stream_or_path or io.BytesIO()

        # Margins: 36 points = 0.5 inch
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=16,
            bottomMargin=16
        )

        styles = getSampleStyleSheet()

        # Custom ATS clean styles
        name_style = ParagraphStyle(
            'AtsName',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0f172a'),
            alignment=1, # Centered
            spaceAfter=3
        )

        contact_style = ParagraphStyle(
            'AtsContact',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#334155'),
            alignment=1,
            spaceAfter=10
        )

        section_heading_style = ParagraphStyle(
            'AtsSectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#0f172a'),
            textTransform='uppercase',
            spaceBefore=6,
            spaceAfter=1
        )

        body_style = ParagraphStyle(
            'AtsBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=12.5,
            textColor=colors.HexColor('#1e293b'),
            spaceAfter=3
        )

        bullet_style = ParagraphStyle(
            'AtsBullet',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#1e293b'),
            leftIndent=14,
            firstLineIndent=-10,
            spaceAfter=1
        )

        item_header_style = ParagraphStyle(
            'AtsItemHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9.5,
            leading=12.5,
            textColor=colors.HexColor('#0f172a'),
            spaceBefore=2,
            spaceAfter=0.5
        )

        story = []

        header = resume_data.get('header', {})
        name = header.get('name') or 'Candidate'
        title = header.get('title') or resume_data.get('target_role') or ''

        # 1. Name & Title
        story.append(Paragraph(name, name_style))
        if title:
            title_style = ParagraphStyle(
                'AtsTitle',
                parent=contact_style,
                fontName='Helvetica-Bold',
                fontSize=11,
                leading=14,
                textColor=colors.HexColor('#2563eb'),
                spaceAfter=3
            )
            story.append(Paragraph(title, title_style))

        # 2. Contact details
        contact_parts = []
        if header.get('email'):
            contact_parts.append(header['email'])
        if header.get('phone'):
            contact_parts.append(header['phone'])
        if header.get('location'):
            contact_parts.append(header['location'])
        if header.get('linkedin'):
            contact_parts.append(f"<a href='{header['linkedin']}' color='#2563eb'>LinkedIn</a>")
        if header.get('github'):
            contact_parts.append(f"<a href='{header['github']}' color='#2563eb'>GitHub</a>")
        if header.get('portfolio'):
            contact_parts.append(f"<a href='{header['portfolio']}' color='#2563eb'>Portfolio</a>")

        if contact_parts:
            story.append(Paragraph(" • ".join(contact_parts), contact_style))

        def add_section_header(title_text):
            story.append(Paragraph(title_text, section_heading_style))
            story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#94a3b8'), spaceAfter=4, spaceBefore=1))

        # 3. Summary
        summary = resume_data.get('summary')
        if summary:
            add_section_header("Professional Summary")
            story.append(Paragraph(summary, body_style))
            story.append(Spacer(1, 3))

        # 4. Technical Skills
        skills = resume_data.get('skills', {})
        has_skills = any(skills.get(k) for k in ['languages', 'frameworks', 'databases', 'tools', 'other'])
        if has_skills:
            add_section_header("Technical Skills")
            cat_labels = {
                'languages': 'Programming Languages',
                'frameworks': 'Frameworks & Libraries',
                'databases': 'Databases',
                'tools': 'Tools & Platforms',
                'other': 'Other Technical Skills'
            }
            for key, label in cat_labels.items():
                items = skills.get(key, [])
                if items:
                    skills_line = f"<b>{label}:</b> " + ", ".join(items)
                    story.append(Paragraph(skills_line, body_style))
            story.append(Spacer(1, 3))

        # 5. Work Experience
        experiences = resume_data.get('experiences', [])
        if experiences:
            add_section_header("Work Experience")
            for exp in experiences:
                role = exp.get('role', '')
                company = exp.get('company', '')
                location = exp.get('location', '')
                start = exp.get('start_date') or ''
                end = exp.get('end_date') or 'Present'
                dates = f"{start} – {end}" if start else ""

                header_text = f"<b>{role}</b> | {company}"
                if location:
                    header_text += f" ({location})"
                if dates:
                    header_text += f" &nbsp;&nbsp;&nbsp;&nbsp; <i>[{dates}]</i>"

                exp_block = [Paragraph(header_text, item_header_style)]
                for bullet in exp.get('bullets', []):
                    exp_block.append(Paragraph(f"• {bullet}", bullet_style))
                exp_block.append(Spacer(1, 3))
                
                story.append(KeepTogether(exp_block))

        # 6. Projects
        projects = resume_data.get('projects', [])
        if projects:
            add_section_header("Projects")
            for proj in projects:
                p_name = proj.get('name', '')
                techs = proj.get('technologies', [])
                domain = proj.get('domain', '')
                p_header = f"<b>{p_name}</b>"
                if domain:
                    p_header += f" ({domain})"

                links = []
                if proj.get('github_url'):
                    links.append(f"<a href='{proj['github_url']}' color='#2563eb'>GitHub</a>")
                if proj.get('live_url'):
                    links.append(f"<a href='{proj['live_url']}' color='#2563eb'>Live</a>")
                if links:
                    p_header += f" | <font size='9.5'>{' • '.join(links)}</font>"

                proj_block = [Paragraph(p_header, item_header_style)]
                if techs:
                    proj_block.append(Paragraph(f"<i>Technologies: {', '.join(techs)}</i>", bullet_style))
                for bullet in proj.get('bullets', []):
                    proj_block.append(Paragraph(f"• {bullet}", bullet_style))
                proj_block.append(Spacer(1, 3))
                
                story.append(KeepTogether(proj_block))

        # 7. Education
        education = resume_data.get('education', [])
        if education:
            add_section_header("Education")
            for edu in education:
                degree = edu.get('degree', '')
                field = edu.get('field', '')
                inst = edu.get('institution', '')
                location = edu.get('location', '')
                start_y = edu.get('start_year')
                end_y = edu.get('end_year') or 'Present'
                grade = edu.get('grade', '')

                degree_text = degree
                if field:
                    degree_text += f" in {field}"
                if grade:
                    degree_text += f" — {grade}"

                dates = f"{start_y} – {end_y}" if start_y else ""

                p_inst = Paragraph(f"<b>{inst}</b>", body_style)
                p_loc = Paragraph(f"<para align='right'>{location}</para>", body_style)
                p_deg = Paragraph(f"<i>{degree_text}</i>", body_style)
                p_dates = Paragraph(f"<para align='right'><i>{dates}</i></para>", body_style)
                
                data = [
                    [p_inst, p_dates],
                    [p_deg, p_loc]
                ]
                
                t = Table(data, colWidths=[400, 140])
                t.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('LEFTPADDING', (0,0), (-1,-1), 0),
                    ('RIGHTPADDING', (0,0), (-1,-1), 0),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 1),
                    ('TOPPADDING', (0,0), (-1,-1), 0),
                ]))
                story.append(t)
                story.append(Spacer(1, 4))

        # 8. Certifications
        certs = resume_data.get('certifications', [])
        if certs:
            add_section_header("Certifications")
            for cert in certs:
                c_name = cert.get('name', '')
                issuer = cert.get('issuer', '')
                date = cert.get('date', '')
                cert_text = f"<b>{c_name}</b>" + (f" — {issuer}" if issuer else "")
                if date:
                    cert_text += f" ({date})"
                story.append(Paragraph(f"• {cert_text}", bullet_style))
            story.append(Spacer(1, 3))

        # 9. Achievements
        achievements = resume_data.get('achievements', [])
        if achievements:
            add_section_header("Key Achievements")
            for ach in achievements:
                title_a = ach.get('title', '')
                desc_a = ach.get('description', '')
                date_a = ach.get('date', '')
                ach_text = f"<b>{title_a}</b>" + (f" ({date_a})" if date_a else "") + f": {desc_a}"
                story.append(Paragraph(f"• {ach_text}", bullet_style))

        doc.build(story)

        if isinstance(buffer, io.BytesIO):
            buffer.seek(0)
        return buffer
