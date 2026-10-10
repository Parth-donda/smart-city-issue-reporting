from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Role, WorkerProfile
from departments.models import Department
from issues.models import IssueCategory, IssuePriority, SLAConfiguration

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds initial departments, categories, SLA configurations, and demo users for each role.'

    def handle(self, *args, **options):
        self.stdout.write("Starting SmartCivic Phase 1 Seed...")

        # 1. Seed Municipal Departments
        dept_data = [
            ("Roads & Infrastructure", "ROADS", "Pothole repairs, resurfacing, curb maintenance, and highway upkeep.", "roads@smartcivic.local", "020-25501001"),
            ("Electrical & Street Lighting", "ELEC", "High-mast lights, transformer hazards, street fixtures, and cable networks.", "elec@smartcivic.local", "020-25501002"),
            ("Water Supply & Sewerage", "WATER", "Pipeline leakages, contamination, low pressure, and storm water drainage.", "water@smartcivic.local", "020-25501003"),
            ("Solid Waste & Sanitation", "SAN", "Garbage collection, overflowing bins, street sweeping, and public sanitation.", "sanitation@smartcivic.local", "020-25501004"),
            ("Traffic Management & Signage", "TRAF", "Traffic lights, speed breakers, pedestrian crossings, and road signboards.", "traffic@smartcivic.local", "020-25501005"),
            ("Parks & Public Spaces", "PARKS", "Municipal gardens, fallen trees, playground equipment, and public encroachments.", "parks@smartcivic.local", "020-25501006"),
            ("Other Civic Matters", "OTHER", "General municipal inquiries, administrative coordination, and miscellaneous services.", "admin@smartcivic.local", "020-25501000"),
        ]

        depts = {}
        for name, code, desc, email, phone in dept_data:
            dept, created = Department.objects.get_or_create(
                code=code,
                defaults={
                    "name": name,
                    "description": desc,
                    "contact_email": email,
                    "contact_phone": phone,
                    "is_active": True,
                }
            )
            depts[code] = dept
            if created:
                self.stdout.write(f"  + Created Department: {name} [{code}]")

        # 2. Seed Issue Categories with Mappings
        category_data = [
            ("Potholes & Road Damage", "POTHOLE", "Damaged asphalt, craters, or road cave-ins on municipal streets.", depts["ROADS"], IssuePriority.HIGH, "Cone"),
            ("Streetlight Outage & Hazard", "STREETLIGHT", "Non-functional lights, dangling wires, or sparking transformers.", depts["ELEC"], IssuePriority.HIGH, "Lightbulb"),
            ("Water Pipeline Leakage", "WATER_LEAK", "Burst pipelines, continuous fresh water wastage, or contamination.", depts["WATER"], IssuePriority.CRITICAL, "Droplets"),
            ("Sewer & Drain Overflow", "SEWER_OVERFLOW", "Blocked gutters, open manholes, or overflowing sewage on streets.", depts["WATER"], IssuePriority.CRITICAL, "AlertTriangle"),
            ("Garbage Dump & Waste Pile", "GARBAGE_DUMP", "Uncollected garbage, overflowing community bins, or illegal debris.", depts["SAN"], IssuePriority.MEDIUM, "Trash2"),
            ("Traffic Light Failure", "TRAFFIC_LIGHT", "Broken traffic signals, missing zebra markings, or damaged signposts.", depts["TRAF"], IssuePriority.HIGH, "Navigation"),
            ("Fallen Tree & Branch Hazard", "FALLEN_TREE", "Uprooted trees obstructing roads or hazardous hanging branches.", depts["PARKS"], IssuePriority.MEDIUM, "Trees"),
            ("Other Civic Problem", "OTHER_CIVIC", "Miscellaneous civic grievances requiring local body review.", depts["OTHER"], IssuePriority.LOW, "HelpCircle"),
        ]

        for name, code, desc, dept, priority, icon in category_data:
            cat, created = IssueCategory.objects.get_or_create(
                code=code,
                defaults={
                    "name": name,
                    "description": desc,
                    "default_department": dept,
                    "default_priority": priority,
                    "icon_name": icon,
                    "is_active": True,
                }
            )
            if created:
                self.stdout.write(f"  + Created Category: {name} -> {dept.code}")

        # 3. Seed SLA Configurations
        sla_data = [
            (IssuePriority.CRITICAL, 4, 12, 2),
            (IssuePriority.HIGH, 12, 24, 4),
            (IssuePriority.MEDIUM, 24, 72, 8),
            (IssuePriority.LOW, 48, 168, 24),
        ]

        for priority, resp_h, resol_h, warn_h in sla_data:
            sla, created = SLAConfiguration.objects.get_or_create(
                priority=priority,
                defaults={
                    "response_time_hours": resp_h,
                    "resolution_time_hours": resol_h,
                    "warning_threshold_hours": warn_h,
                }
            )
            if created:
                self.stdout.write(f"  + Created SLA Config: {priority} ({resol_h}h resolution target)")

        # 4. Seed Demo Users for each role (Password: pass123)
        demo_users = [
            ("citizen", "citizen@smartcivic.local", "Aarav", "Sharma", Role.CITIZEN, "9876500001", None),
            ("officer", "officer@smartcivic.local", "Vikram", "Deshmukh", Role.DEPARTMENT_OFFICER, "9876500002", "ROADS"),
            ("worker", "worker@smartcivic.local", "Rajesh", "Kumar", Role.WORKER, "9876500003", "ROADS"),
            ("worker2", "worker2@smartcivic.local", "Sunil", "Shinde", Role.WORKER, "9876500006", "ROADS"),
            ("supervisor", "supervisor@smartcivic.local", "Anjali", "Patil", Role.SUPERVISOR, "9876500004", "ROADS"),
            ("admin", "admin@smartcivic.local", "Kavita", "Rao", Role.MUNICIPAL_ADMIN, "9876500005", None),
        ]

        for username, email, fname, lname, role, phone, dept_code in demo_users:
            dept_obj = depts.get(dept_code) if dept_code else None
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                    "first_name": fname,
                    "last_name": lname,
                    "role": role,
                    "department": dept_obj,
                    "phone": phone,
                    "is_staff": role in [Role.MUNICIPAL_ADMIN, Role.SYSTEM_ADMIN],
                    "is_superuser": role in [Role.MUNICIPAL_ADMIN, Role.SYSTEM_ADMIN],
                    "is_verified": True,
                }
            )
            user.set_password("pass123")
            user.role = role
            user.department = dept_obj
            user.save()

            if role == Role.WORKER and dept_code:
                skills_desc = "Road asphalt patching, heavy compaction, pneumatic drilling" if username == "worker" else "Drainage desilting, paver block realignment, masonry"
                WorkerProfile.objects.update_or_create(
                    user=user,
                    defaults={
                        "department": depts[dept_code],
                        "phone": phone,
                        "skills": skills_desc,
                        "is_available": True,
                        "active_task_count": 0,
                    }
                )

            self.stdout.write(f"  + User '{username}' [{role}] ({dept_code or 'General'}) ready (pass123)")

        self.stdout.write(self.style.SUCCESS("[SUCCESS] SmartCivic seed_demo completed successfully!"))
