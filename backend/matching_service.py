import math

def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculates the distance in KM between two GPS coordinates.
    """
    R = 6371  # Earth radius in km
    
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    
    a = math.sin(dphi / 2)**2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def compute_match_score(volunteer, task):
    """
    Calculates a score from 0-100 based on the 4-tier weighted formula:
    - Skill overlap (Jaccard) = 40%
    - Proximity (Inverse decay, max 15km) = 25%
    - Task urgency = 20%
    - Availability = 15%
    """
    # 1. Skill Overlap (Jaccard Similarity) - 40%
    v_skills = set(s.lower() for s in volunteer.get('skills', []))
    t_skills = set(s.lower() for s in task.get('skills', []))
    
    skill_score = 0
    if t_skills:
        intersection = v_skills.intersection(t_skills)
        union = v_skills.union(t_skills)
        skill_score = (len(intersection) / len(union)) * 100
    
    # 2. Proximity (Inverse distance decay, max 15km) - 25%
    dist = task.get('distance_km', 0)
    proximity_score = max(0, (15 - dist) / 15) * 100
    
    # 3. Urgency Score Passthrough - 20%
    # Task urgency is 0-10, normalize to 0-100
    urgency_raw = task.get('urgency_score', 0)
    urgency_score = urgency_raw * 10
    
    # 4. Availability Match - 15%
    is_available = volunteer.get('is_available', True)
    availability_score = 100 if is_available else 0
    
    # --- RULE: High Urgency Bypass ---
    if urgency_raw >= 9.0:
        availability_score = 100 # Bypass availability filter
    
    # Weighted calculation
    final_score = (
        (skill_score * 0.40) + 
        (proximity_score * 0.25) + 
        (urgency_score * 0.20) + 
        (availability_score * 0.15)
    )
    
    return round(final_score, 1)
