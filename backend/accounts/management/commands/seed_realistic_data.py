import random
import hashlib
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from accounts.models import Role, WorkerProfile
from departments.models import Department
from issues.models import (
    Issue,
    IssueCategory,
    IssuePriority,
    IssueStatus,
    IssueLocation,
    IssueStatusHistory,
    CompletionEvidence,
    CitizenFeedback,
    SLAConfiguration,
    IssueRejectionReason
)
from audit.models import AuditLog

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds full realistic municipal dataset with ~60 issues across all departments and lifecycle states.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding comprehensive realistic SmartCivic dataset...")

        now = timezone.now()

        # 1. Departments
        dept_info = [
            ("Roads & Infrastructure", "ROADS", "Pothole repairs, resurfacing, curb maintenance, and highway upkeep.", "roads@smartcivic.local", "020-25501001"),
            ("Electrical & Street Lighting", "ELEC", "High-mast lights, transformer hazards, street fixtures, and cable networks.", "elec@smartcivic.local", "020-25501002"),
            ("Water Supply & Sewerage", "WATER", "Pipeline leakages, contamination, low pressure, and storm water drainage.", "water@smartcivic.local", "020-25501003"),
            ("Solid Waste & Sanitation", "SAN", "Garbage collection, overflowing bins, street sweeping, and public sanitation.", "sanitation@smartcivic.local", "020-25501004"),
            ("Traffic Management & Signage", "TRAF", "Traffic lights, speed breakers, pedestrian crossings, and road signboards.", "traffic@smartcivic.local", "020-25501005"),
            ("Parks & Public Spaces", "PARKS", "Municipal gardens, fallen trees, playground equipment, and public encroachments.", "parks@smartcivic.local", "020-25501006"),
            ("Other Civic Matters", "OTHER", "General municipal inquiries, administrative coordination, and miscellaneous services.", "admin@smartcivic.local", "020-25501000"),
        ]

        depts = {}
        for name, code, desc, email, phone in dept_info:
            dept, _ = Department.objects.get_or_create(
                code=code,
                defaults={"name": name, "description": desc, "contact_email": email, "contact_phone": phone, "is_active": True}
            )
            depts[code] = dept

        # 2. Categories
        cat_info = [
            ("Potholes & Road Damage", "POTHOLE", "Damaged asphalt, craters, or road cave-ins on municipal streets.", depts["ROADS"], IssuePriority.HIGH, "Cone"),
            ("Streetlight Outage & Hazard", "STREETLIGHT", "Non-functional lights, dangling wires, or sparking transformers.", depts["ELEC"], IssuePriority.HIGH, "Lightbulb"),
            ("Water Pipeline Leakage", "WATER_LEAK", "Burst pipelines, continuous fresh water wastage, or contamination.", depts["WATER"], IssuePriority.CRITICAL, "Droplets"),
            ("Sewer & Drain Overflow", "SEWER_OVERFLOW", "Blocked gutters, open manholes, or overflowing sewage on streets.", depts["WATER"], IssuePriority.CRITICAL, "AlertTriangle"),
            ("Garbage Dump & Waste Pile", "GARBAGE_DUMP", "Uncollected garbage, overflowing community bins, or illegal debris.", depts["SAN"], IssuePriority.MEDIUM, "Trash2"),
            ("Traffic Light Failure", "TRAFFIC_LIGHT", "Broken traffic signals, missing zebra markings, or damaged signposts.", depts["TRAF"], IssuePriority.HIGH, "Navigation"),
            ("Fallen Tree & Branch Hazard", "FALLEN_TREE", "Uprooted trees obstructing roads or hazardous hanging branches.", depts["PARKS"], IssuePriority.MEDIUM, "Trees"),
            ("Other Civic Problem", "OTHER_CIVIC", "Miscellaneous civic grievances requiring local body review.", depts["OTHER"], IssuePriority.LOW, "HelpCircle"),
        ]

        categories = {}
        for name, code, desc, dept, priority, icon in cat_info:
            cat, _ = IssueCategory.objects.get_or_create(
                code=code,
                defaults={"name": name, "description": desc, "default_department": dept, "default_priority": priority, "icon_name": icon, "is_active": True}
            )
            categories[code] = cat

        # 3. SLA Matrix
        sla_table = [
            (IssuePriority.CRITICAL, 4, 12, 2),
            (IssuePriority.HIGH, 12, 24, 4),
            (IssuePriority.MEDIUM, 24, 72, 8),
            (IssuePriority.LOW, 48, 168, 24),
        ]
        for priority, resp_h, resol_h, warn_h in sla_table:
            SLAConfiguration.objects.update_or_create(
                priority=priority,
                defaults={"response_time_hours": resp_h, "resolution_time_hours": resol_h, "warning_threshold_hours": warn_h}
            )

        # 4. Users
        users_to_seed = [
            ("citizen", "citizen@smartcivic.local", "Aarav", "Sharma", Role.CITIZEN, "9876500001", None),
            ("citizen2", "citizen2@smartcivic.local", "Pooja", "Patel", Role.CITIZEN, "9876500007", None),
            ("citizen3", "citizen3@smartcivic.local", "Rohan", "Mehta", Role.CITIZEN, "9876500008", None),

            ("officer", "officer@smartcivic.local", "Vikram", "Deshmukh", Role.DEPARTMENT_OFFICER, "9876500002", "ROADS"),
            ("officer_elec", "elec_officer@smartcivic.local", "Suresh", "Rane", Role.DEPARTMENT_OFFICER, "9876500011", "ELEC"),
            ("officer_water", "water_officer@smartcivic.local", "Mahesh", "Jadhav", Role.DEPARTMENT_OFFICER, "9876500012", "WATER"),
            ("officer_san", "san_officer@smartcivic.local", "Anita", "Gupta", Role.DEPARTMENT_OFFICER, "9876500013", "SAN"),

            ("supervisor", "supervisor@smartcivic.local", "Anjali", "Patil", Role.SUPERVISOR, "9876500004", "ROADS"),
            ("sup_elec", "elec_sup@smartcivic.local", "Kishore", "Verma", Role.SUPERVISOR, "9876500014", "ELEC"),
            ("sup_water", "water_sup@smartcivic.local", "Dinesh", "Kulkarni", Role.SUPERVISOR, "9876500015", "WATER"),

            ("worker", "worker@smartcivic.local", "Rajesh", "Kumar", Role.WORKER, "9876500003", "ROADS"),
            ("worker2", "worker2@smartcivic.local", "Sunil", "Shinde", Role.WORKER, "9876500006", "ROADS"),
            ("worker_elec", "elec_worker@smartcivic.local", "Ramesh", "Nair", Role.WORKER, "9876500016", "ELEC"),
            ("worker_water", "water_worker@smartcivic.local", "Ganesh", "Pawar", Role.WORKER, "9876500017", "WATER"),
            ("worker_san", "san_worker@smartcivic.local", "Bablu", "Yadav", Role.WORKER, "9876500018", "SAN"),

            ("admin", "admin@smartcivic.local", "Kavita", "Rao", Role.MUNICIPAL_ADMIN, "9876500005", None),
        ]

        seeded_users = {}
        for username, email, fname, lname, role, phone, dept_code in users_to_seed:
            dept_obj = depts.get(dept_code) if dept_code else None
            user, _ = User.objects.get_or_create(
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
            seeded_users[username] = user

            if role == Role.WORKER and dept_code:
                WorkerProfile.objects.update_or_create(
                    user=user,
                    defaults={
                        "department": depts[dept_code],
                        "phone": phone,
                        "skills": "Field maintenance, inspection, mechanical repair, equipment operation",
                        "is_available": True,
                        "active_task_count": 0,
                    }
                )

        # Sample problem templates
        ISSUE_BLUEPRINTS = [
            # ROADS
            ("POTHOLE", "Severe Pothole Cluster on Main Ring Road", "Multiple deep craters causing heavy vehicle swerving and tire punctures near Junction 4.", IssuePriority.HIGH, "ROADS", "Near Metro Pillar 142, Ring Road", "Ward 7 - West Zone", 18.52043, 73.85674),
            ("POTHOLE", "Asphalt Cave-in opposite City Mall", "Dangerous road cave-in roughly 1.5 meters wide after underground cabling trench collapse.", IssuePriority.CRITICAL, "ROADS", "Opposite City Centre Mall, MG Road", "Ward 3 - Central", 18.53120, 73.84450),
            ("POTHOLE", "Sunken Paver Blocks on Pedestrian Walkway", "Uneven paver blocks tripping pedestrians outside government dispensary.", IssuePriority.MEDIUM, "ROADS", "Station Road Pedestrian Plaza", "Ward 1 - Railway Zone", 18.52890, 73.87410),
            ("POTHOLE", "Damaged Speed Breaker with Exposed Rebars", "Broken concrete speed bump with exposed iron rods endangering two-wheelers.", IssuePriority.HIGH, "ROADS", "Lane 5, Shivaji Nagar", "Ward 5 - North Zone", 18.53500, 73.85000),
            ("POTHOLE", "Road Shoulder Erosion along River Bridge", "Eroded tarmac shoulder creating hazardous sudden drop on bridge approach.", IssuePriority.HIGH, "ROADS", "Z-Bridge Approach, Deccan", "Ward 4 - Riverside", 18.51700, 73.84100),

            # ELEC
            ("STREETLIGHT", "Streetlights completely dark for 400m stretch", "High-density residential corridor plunged into total darkness for three consecutive nights.", IssuePriority.HIGH, "ELEC", "Sector 12 Avenue Road", "Ward 12 - Suburb", 18.56000, 73.80000),
            ("STREETLIGHT", "Sparks and Smoke from Overhead Feeder Line", "Dangerous arcing and popping sound from transformer junction box near school gate.", IssuePriority.CRITICAL, "ELEC", "Near St. Xavier High School, Model Colony", "Ward 6 - Model Colony", 18.54000, 73.83000),
            ("STREETLIGHT", "Broken Lamppost Leaning over Cycle Track", "Vehicle collision damaged pole base; entire structure is leaning precariously.", IssuePriority.CRITICAL, "ELEC", "Greenway Cycle Track, Ward 8", "Ward 8 - East Zone", 18.51000, 73.89000),
            ("STREETLIGHT", "Daytime Burning Streetlights (Sensor Failure)", "Cluster of 12 streetlights burning non-stop throughout day, wasting municipal energy.", IssuePriority.LOW, "ELEC", "Koregaon Park South Main Road", "Ward 9 - Koregaon", 18.53600, 73.89500),

            # WATER
            ("WATER_LEAK", "Major 600mm Main Pipeline Rupture", "Fresh drinking water gushing onto highway at high pressure, flooding 2 lanes.", IssuePriority.CRITICAL, "WATER", "NH4 Bypass Service Road", "Ward 14 - Highway", 18.50500, 73.81000),
            ("WATER_LEAK", "Continuous Valve Chamber Leakage", "Water continuously seeping from municipal air valve chamber creating moss and sludge.", IssuePriority.MEDIUM, "WATER", "Market Yard Gate No. 2", "Ward 10 - Market", 18.49000, 73.86500),
            ("SEWER_OVERFLOW", "Choked Underground Drainage Chamber", "Raw sewage overflowing onto residential street corner with severe stench and health hazard.", IssuePriority.CRITICAL, "WATER", "Cross Road 3, Somwar Peth", "Ward 2 - Heritage", 18.52400, 73.86800),
            ("SEWER_OVERFLOW", "Broken Heavy-Duty Manhole Cover", "Missing storm drain cover in middle of narrow lane; residents placed temporary tree branch.", IssuePriority.CRITICAL, "WATER", "Ganesh Peth Main Alley", "Ward 2 - Heritage", 18.51900, 73.86200),
            ("WATER_LEAK", "Low Water Pressure and Turbid Supply", "Brown muddy water received in 4 residential societies for the past 48 hours.", IssuePriority.HIGH, "WATER", "Prabhat Road Lane 14", "Ward 4 - Deccan", 18.51300, 73.83400),

            # SANITATION
            ("GARBAGE_DUMP", "Illegal Debris and Community Dump Overflow", "Huge accumulation of municipal solid waste blocking half the secondary roadway.", IssuePriority.MEDIUM, "SAN", "Near Vegetable Mandi, Hadapsar", "Ward 11 - Hadapsar", 18.50100, 73.93000),
            ("GARBAGE_DUMP", "Unlifted Hotel Kitchen Waste Dump", "Stray animal menace due to uncollected organic waste piled up over the weekend.", IssuePriority.HIGH, "SAN", "Restaurant Row, FC Road", "Ward 4 - Deccan", 18.52200, 73.84000),
            ("GARBAGE_DUMP", "Medical and Plastic Packaging Burned in Open", "Hazardous open burning of mixed commercial trash near playground.", IssuePriority.CRITICAL, "SAN", "Indira Nagar Ground", "Ward 13 - South", 18.48000, 73.85000),

            # TRAFFIC
            ("TRAFFIC_LIGHT", "Traffic Signal Controller Freeze at 4-Way Intersection", "All four signal aspects stuck on red simultaneously creating massive gridlock.", IssuePriority.CRITICAL, "TRAF", "Swargate 5-Point Crossing", "Ward 10 - Swargate", 18.50200, 73.85800),
            ("TRAFFIC_LIGHT", "Missing Zebra Crossing & Speed Limit Signboard", "Worn out road markings outside primary school leading to high speed vehicle risks.", IssuePriority.MEDIUM, "TRAF", "University Road, near E-Square", "Ward 5 - North Zone", 18.53800, 73.83200),
            ("TRAFFIC_LIGHT", "Bent Overhead Signboard Obscuring Lane View", "Gantry signage bent by oversized truck, blocking view of directional arrows.", IssuePriority.LOW, "TRAF", "Pune-Satara Road Junction", "Ward 10 - Swargate", 18.49500, 73.85500),

            # PARKS
            ("FALLEN_TREE", "Large Banyan Branch Crashed across Carriageway", "Heavy branch snapped during thunderstorm blocking arterial route completely.", IssuePriority.CRITICAL, "PARKS", "Bund Garden Road", "Ward 1 - Railway Zone", 18.53300, 73.88200),
            ("FALLEN_TREE", "Dead Gulmohar Tree Leaning toward Power Lines", "Termite infested tree leaning dangerously close to 11kV distribution line.", IssuePriority.HIGH, "PARKS", "Ghole Road near Art Gallery", "Ward 4 - Deccan", 18.52500, 73.84500),
            ("FALLEN_TREE", "Broken Children Swing & Open Electrical Conduit in Park", "Public park play equipment broken with sharp edges exposed to toddlers.", IssuePriority.MEDIUM, "PARKS", "Sarasbaug Public Garden", "Ward 10 - Swargate", 18.50300, 73.85400),

            # OTHER
            ("OTHER_CIVIC", "Unauthorized Commercial Banner Obstructing Footpath", "Gigantic metal hoarding frame erected on footpath without municipal permission.", IssuePriority.LOW, "OTHER", "Karve Road Corner", "Ward 4 - Deccan", 18.50800, 73.83000),
            ("OTHER_CIVIC", "Public Fountain Stagnant Water & Mosquito Breeding", "Non-operational civic fountain filled with stagnant green rainwater.", IssuePriority.MEDIUM, "OTHER", "Municipal Circle Fountain", "Ward 3 - Central", 18.52700, 73.85500),
        ]

        # Lifecycle status distribution to simulate
        STATUS_POOL = [
            (IssueStatus.SUBMITTED, 10),
            (IssueStatus.UNDER_REVIEW, 8),
            (IssueStatus.ACCEPTED, 6),
            (IssueStatus.ASSIGNED, 8),
            (IssueStatus.ON_THE_WAY, 3),
            (IssueStatus.WORK_STARTED, 3),
            (IssueStatus.IN_PROGRESS, 6),
            (IssueStatus.DONE, 5),
            (IssueStatus.VERIFIED, 4),
            (IssueStatus.CLOSED, 8),
            (IssueStatus.REJECTED, 3),
            (IssueStatus.REOPENED, 4),
        ]

        citizens_list = [seeded_users["citizen"], seeded_users["citizen2"], seeded_users["citizen3"]]
        roads_officer = seeded_users["officer"]
        roads_supervisor = seeded_users["supervisor"]
        roads_worker = seeded_users["worker"]
        roads_worker2 = seeded_users["worker2"]

        created_count = 0

        for target_status, count in STATUS_POOL:
            for _ in range(count):
                bp = random.choice(ISSUE_BLUEPRINTS)
                cat_code, title_base, desc_base, def_priority, dept_code, addr, ward, lat, lng = bp

                citizen_user = random.choice(citizens_list)
                dept_obj = depts[dept_code]
                cat_obj = categories[cat_code]

                # Randomize coordinates slightly
                actual_lat = lat + random.uniform(-0.008, 0.008)
                actual_lng = lng + random.uniform(-0.008, 0.008)

                # Random creation time between 1 and 7 days ago
                age_hours = random.randint(12, 144)
                created_time = now - timedelta(hours=age_hours)

                # Resolution target based on priority
                resol_hours = 12 if def_priority == IssuePriority.CRITICAL else (24 if def_priority == IssuePriority.HIGH else 72)
                deadline = created_time + timedelta(hours=resol_hours)
                is_breached = (now > deadline) and (target_status not in [IssueStatus.DONE, IssueStatus.VERIFIED, IssueStatus.CLOSED, IssueStatus.REJECTED])

                assigned_worker_user = None
                assigned_by_user = None

                assigned_worker_user = None
                assigned_by_user = None

                if target_status in [
                    IssueStatus.ASSIGNED, IssueStatus.ON_THE_WAY, IssueStatus.ARRIVED,
                    IssueStatus.WORK_STARTED, IssueStatus.IN_PROGRESS, IssueStatus.DONE,
                    IssueStatus.VERIFIED, IssueStatus.CLOSED, IssueStatus.REOPENED
                ]:
                    if dept_code == "ROADS":
                        assigned_worker_user = random.choice([roads_worker, roads_worker2])
                    elif dept_code == "ELEC":
                        assigned_worker_user = seeded_users["worker_elec"]
                    elif dept_code == "WATER":
                        assigned_worker_user = seeded_users["worker_water"]
                    elif dept_code == "SAN":
                        assigned_worker_user = seeded_users["worker_san"]
                    else:
                        assigned_worker_user = roads_worker
                    assigned_by_user = roads_officer

                rejection_reason = ""
                rejection_notes = ""
                if target_status == IssueStatus.REJECTED:
                    rejection_reason = random.choice([
                        IssueRejectionReason.DUPLICATE,
                        IssueRejectionReason.INVALID_EVIDENCE,
                        IssueRejectionReason.OUTSIDE_RESPONSIBILITY
                    ])
                    rejection_notes = "Official verification confirmed non-qualifying grievance or duplicate entry on municipal system."

                # Create Issue
                issue = Issue.objects.create(
                    citizen=citizen_user,
                    title=f"{title_base} #{random.randint(100, 999)}",
                    description=desc_base,
                    category=cat_obj,
                    department=dept_obj,
                    priority=def_priority,
                    status=target_status,
                    assigned_worker=assigned_worker_user,
                    assigned_by=assigned_by_user,
                    rejection_reason=rejection_reason,
                    rejection_notes=rejection_notes,
                    sla_deadline=deadline,
                    is_sla_breached=is_breached,
                )
                # Overwrite auto_now_add timestamps to simulate realistic history
                Issue.objects.filter(id=issue.id).update(created_at=created_time, updated_at=created_time + timedelta(hours=1))

                # Location
                IssueLocation.objects.create(
                    issue=issue,
                    latitude=round(actual_lat, 6),
                    longitude=round(actual_lng, 6),
                    address_text=f"{addr}, Ward {ward}",
                    landmark=f"Near Landmark {random.randint(1, 20)}",
                    ward=ward,
                    captured_at=created_time
                )

                # Status History Timeline
                IssueStatusHistory.objects.create(
                    issue=issue,
                    from_status=IssueStatus.SUBMITTED,
                    to_status=IssueStatus.SUBMITTED,
                    changed_by=citizen_user,
                    remarks="Issue submitted by citizen via SmartCivic portal.",
                    created_at=created_time
                )

                if target_status != IssueStatus.SUBMITTED:
                    review_time = created_time + timedelta(hours=2)
                    IssueStatusHistory.objects.create(
                        issue=issue,
                        from_status=IssueStatus.SUBMITTED,
                        to_status=IssueStatus.UNDER_REVIEW,
                        changed_by=roads_officer,
                        remarks="Triage officer commenced assessment.",
                        created_at=review_time
                    )

                if target_status in [
                    IssueStatus.ACCEPTED, IssueStatus.ASSIGNED, IssueStatus.ON_THE_WAY,
                    IssueStatus.ARRIVED, IssueStatus.WORK_STARTED, IssueStatus.IN_PROGRESS,
                    IssueStatus.DONE, IssueStatus.VERIFIED, IssueStatus.CLOSED, IssueStatus.REOPENED
                ]:
                    accept_time = created_time + timedelta(hours=3)
                    IssueStatusHistory.objects.create(
                        issue=issue,
                        from_status=IssueStatus.UNDER_REVIEW,
                        to_status=IssueStatus.ACCEPTED,
                        changed_by=roads_officer,
                        remarks="Issue accepted and routed for field action.",
                        created_at=accept_time
                    )

                if target_status in [
                    IssueStatus.ASSIGNED, IssueStatus.ON_THE_WAY, IssueStatus.ARRIVED,
                    IssueStatus.WORK_STARTED, IssueStatus.IN_PROGRESS, IssueStatus.DONE,
                    IssueStatus.VERIFIED, IssueStatus.CLOSED, IssueStatus.REOPENED
                ] and assigned_worker_user:
                    assign_time = created_time + timedelta(hours=4)
                    IssueStatusHistory.objects.create(
                        issue=issue,
                        from_status=IssueStatus.ACCEPTED,
                        to_status=IssueStatus.ASSIGNED,
                        changed_by=roads_officer,
                        remarks=f"Work order assigned to field worker {assigned_worker_user.first_name}.",
                        created_at=assign_time
                    )

                if target_status in [
                    IssueStatus.WORK_STARTED, IssueStatus.IN_PROGRESS, IssueStatus.DONE,
                    IssueStatus.VERIFIED, IssueStatus.CLOSED, IssueStatus.REOPENED
                ] and assigned_worker_user:
                    prog_time = created_time + timedelta(hours=6)
                    IssueStatusHistory.objects.create(
                        issue=issue,
                        from_status=IssueStatus.ASSIGNED,
                        to_status=IssueStatus.IN_PROGRESS,
                        changed_by=assigned_worker_user,
                        remarks="Field team arrived on site; maintenance and repairs in progress.",
                        created_at=prog_time
                    )

                # Completion Evidence for DONE, VERIFIED, CLOSED, REOPENED
                if target_status in [IssueStatus.DONE, IssueStatus.VERIFIED, IssueStatus.CLOSED, IssueStatus.REOPENED]:
                    done_time = created_time + timedelta(hours=10)
                    CompletionEvidence.objects.create(
                        issue=issue,
                        worker=assigned_worker_user or roads_worker,
                        description="Excavated compromised layer, applied industrial hot-mix asphalt, compacted with roller, and restored surface leveling.",
                        materials_used="Hot-mix asphalt 85kg, bitumen tack coat, masonry cement, safety barricade markers",
                        latitude=round(actual_lat, 6),
                        longitude=round(actual_lng, 6),
                        completed_at=done_time
                    )
                    IssueStatusHistory.objects.create(
                        issue=issue,
                        from_status=IssueStatus.IN_PROGRESS,
                        to_status=IssueStatus.DONE,
                        changed_by=assigned_worker_user or roads_worker,
                        remarks="Field work completed with photographic proof submitted.",
                        created_at=done_time
                    )

                if target_status in [IssueStatus.VERIFIED, IssueStatus.CLOSED]:
                    ver_time = created_time + timedelta(hours=14)
                    IssueStatusHistory.objects.create(
                        issue=issue,
                        from_status=IssueStatus.DONE,
                        to_status=IssueStatus.VERIFIED,
                        changed_by=roads_supervisor,
                        remarks="Supervisor inspected photo evidence and on-site repair. Verified quality standards.",
                        created_at=ver_time
                    )

                if target_status == IssueStatus.CLOSED:
                    close_time = created_time + timedelta(hours=16)
                    CitizenFeedback.objects.create(
                        issue=issue,
                        citizen=citizen_user,
                        is_satisfied=True,
                        rating=random.choice([4, 5]),
                        comment="Prompt response and clean road repair work. Thank you municipal team!",
                        is_reopened=False
                    )
                    IssueStatusHistory.objects.create(
                        issue=issue,
                        from_status=IssueStatus.VERIFIED,
                        to_status=IssueStatus.CLOSED,
                        changed_by=citizen_user,
                        remarks="Citizen confirmed satisfaction and closed the grievance.",
                        created_at=close_time
                    )

                if target_status == IssueStatus.REOPENED:
                    reopen_time = created_time + timedelta(hours=15)
                    CitizenFeedback.objects.create(
                        issue=issue,
                        citizen=citizen_user,
                        is_satisfied=False,
                        rating=1,
                        comment="The asphalt patch was incomplete and surface remained uneven.",
                        is_reopened=True
                    )
                    IssueStatusHistory.objects.create(
                        issue=issue,
                        from_status=IssueStatus.DONE,
                        to_status=IssueStatus.REOPENED,
                        changed_by=citizen_user,
                        remarks="Citizen marked work unsatisfied and reopened ticket.",
                        created_at=reopen_time
                    )

                # Seed Phase 8 Evidence Verification
                from evidence.models import EvidenceVerification, ConfidenceBand
                conf_score = random.randint(78, 98)
                c_band = ConfidenceBand.HIGH if conf_score >= 85 else ConfidenceBand.MEDIUM
                EvidenceVerification.objects.create(
                    issue=issue,
                    overall_confidence_score=conf_score,
                    confidence_band=c_band,
                    location_consistency="CONSISTENT",
                    timestamp_consistency="CONSISTENT",
                    exif_metadata={
                        "device_make": "Samsung",
                        "device_model": "SM-G998B",
                        "capture_datetime": created_time.strftime("%Y:%m:%d %H:%M:%S"),
                        "calculated_distance_km": 0.12,
                    },
                    manipulation_indicators={
                        "location_analysis": {"status": "CONSISTENT", "remarks": "EXIF GPS matches reported site within 120m."},
                        "timestamp_analysis": {"status": "CONSISTENT", "remarks": "Captured within 1 hour of submission."},
                        "duplicate_analysis": {"status": "UNIQUE", "remarks": "Perceptual hash unique — no duplicate image detected."},
                        "capture_source": "CAMERA",
                        "software_used": "Native Camera / Android OS"
                    },
                    file_hash_sha256=hashlib.sha256(f"{issue.issue_id}-{created_time}".encode()).hexdigest(),
                    perceptual_hash=f"d8f0{random.randint(10000000, 99999999):x}",
                    verified_at=created_time
                )

                # Audit Log
                AuditLog.objects.create(
                    issue=issue,
                    actor=citizen_user,
                    role=citizen_user.role,
                    action="ISSUE_SUBMITTED",
                    details={"title": issue.title, "priority": issue.priority, "ward": ward},
                    ip_address="192.168.1.10"
                )
                if target_status != IssueStatus.SUBMITTED:
                    AuditLog.objects.create(
                        issue=issue,
                        actor=roads_officer,
                        role=roads_officer.role,
                        action=f"TRANSITION_TO_{target_status}",
                        details={"status": target_status, "dept": dept_code},
                        ip_address="192.168.1.50"
                    )

                created_count += 1

        self.stdout.write(self.style.SUCCESS(f"[SUCCESS] Seeded {created_count} realistic civic issues and full audit logs across all municipal departments!"))
