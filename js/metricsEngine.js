const EARTH_RADIUS_METERS = 6371000;
const MAX_ACCEPTABLE_ACCURACY_METERS = 65;
const MIN_ACCEPTED_ACCURACY_METERS = 30;
const MIN_SEGMENT_DISTANCE_METERS = 4;
const MAX_REASONABLE_SPEED_MPS = 8.5;
const CURRENT_PACE_WINDOW_MS = 30000;
const CURRENT_PACE_MIN_DISTANCE_METERS = 18;
const CURRENT_PACE_STALE_MS = 12000;
const ROUTE_VIEWBOX = { width: 300, height: 150, padding: 18 };

export function createRunMetrics({ targetDistanceKm }) {
    const startedAt = Date.now();
    const acceptedPoints = [];
    const recentSegments = [];
    let currentPosition = null;
    let distanceMeters = 0;
    let latestAcceptedAt = null;

    function tick(now = Date.now()) {
        pruneRecentSegments(now);
        return buildSnapshot(now);
    }

    function addPosition(position, now = Date.now()) {
        const point = normalizePosition(position);

        if (!point) {
            return { accepted: false, reason: 'invalid', snapshot: buildSnapshot(now) };
        }

        currentPosition = point;

        if (point.accuracy > MAX_ACCEPTABLE_ACCURACY_METERS) {
            return { accepted: false, reason: 'accuracy', snapshot: buildSnapshot(now) };
        }

        if (acceptedPoints.length === 0) {
            acceptedPoints.push({ ...point, totalDistanceMeters: 0 });
            latestAcceptedAt = point.timestamp;
            return { accepted: true, reason: 'seed', snapshot: buildSnapshot(now) };
        }

        const lastPoint = acceptedPoints[acceptedPoints.length - 1];
        const deltaMs = Math.max(point.timestamp - lastPoint.timestamp, 1);
        const deltaMeters = haversineDistanceMeters(lastPoint, point);
        const jitterThreshold = Math.max(MIN_SEGMENT_DISTANCE_METERS, Math.min(point.accuracy, MIN_ACCEPTED_ACCURACY_METERS) * 0.45);
        const inferredSpeed = deltaMeters / (deltaMs / 1000);

        if (deltaMeters <= jitterThreshold) {
            return { accepted: false, reason: 'jitter', snapshot: buildSnapshot(now) };
        }

        if (inferredSpeed > MAX_REASONABLE_SPEED_MPS && deltaMeters > 12) {
            return { accepted: false, reason: 'speed', snapshot: buildSnapshot(now) };
        }

        distanceMeters += deltaMeters;
        latestAcceptedAt = point.timestamp;
        acceptedPoints.push({
            ...point,
            totalDistanceMeters: distanceMeters
        });
        recentSegments.push({
            timestamp: point.timestamp,
            durationMs: deltaMs,
            distanceMeters: deltaMeters
        });
        pruneRecentSegments(now);

        return { accepted: true, reason: 'accepted', snapshot: buildSnapshot(now) };
    }

    function buildSnapshot(now = Date.now()) {
        const elapsedMs = Math.max(0, now - startedAt);
        const elapsedSec = Math.floor(elapsedMs / 1000);
        const distanceKm = distanceMeters / 1000;
        const averagePace = distanceMeters >= 10 ? (elapsedMs / 60000) / distanceKm : null;
        const currentPace = getCurrentPace(now);
        const remainingDistanceKm = Math.max(0, targetDistanceKm - distanceKm);
        const routePreview = buildRoutePreview();
        const displayPoint = acceptedPoints[acceptedPoints.length - 1] || currentPosition;

        return {
            elapsedSec,
            distanceKm,
            averagePace,
            currentPace,
            calories: Math.floor(distanceKm * 60),
            remainingDistanceKm,
            progressPercent: targetDistanceKm > 0 ? Math.min((distanceKm / targetDistanceKm) * 100, 100) : 0,
            currentAccuracy: currentPosition?.accuracy ?? null,
            displayPoint,
            hasLocationFix: acceptedPoints.length > 0,
            gpsQuality: getGpsQuality(currentPosition?.accuracy ?? null),
            routePointCount: acceptedPoints.length,
            routePreview
        };
    }

    function getCurrentPace(now) {
        if (!recentSegments.length || !latestAcceptedAt || now - latestAcceptedAt > CURRENT_PACE_STALE_MS) {
            return null;
        }

        const totals = recentSegments.reduce((sum, segment) => {
            sum.distanceMeters += segment.distanceMeters;
            sum.durationMs += segment.durationMs;
            return sum;
        }, { distanceMeters: 0, durationMs: 0 });

        if (totals.distanceMeters < CURRENT_PACE_MIN_DISTANCE_METERS || totals.durationMs <= 0) {
            return null;
        }

        return (totals.durationMs / 60000) / (totals.distanceMeters / 1000);
    }

    function pruneRecentSegments(now) {
        while (recentSegments.length > 0 && now - recentSegments[0].timestamp > CURRENT_PACE_WINDOW_MS) {
            recentSegments.shift();
        }
    }

    function buildRoutePreview() {
        const sourcePoints = acceptedPoints.length > 0 ? acceptedPoints : (currentPosition ? [currentPosition] : []);
        if (!sourcePoints.length) {
            return {
                polyline: '',
                start: null,
                current: null
            };
        }

        const reference = sourcePoints[0];
        const projected = sourcePoints.map(point => ({
            ...projectToLocalMeters(point, reference)
        }));

        const displayPoint = currentPosition && currentPosition.accuracy <= MAX_ACCEPTABLE_ACCURACY_METERS
            ? currentPosition
            : acceptedPoints[acceptedPoints.length - 1] || currentPosition;
        const currentProjected = displayPoint ? projectToLocalMeters(displayPoint, reference) : projected[projected.length - 1];
        const allProjected = currentProjected ? projected.concat(currentProjected) : projected;
        const bounds = getProjectedBounds(allProjected);
        const normalizedPoints = projected.map(point => scaleRoutePoint(point, bounds));
        const normalizedCurrent = currentProjected ? scaleRoutePoint(currentProjected, bounds) : null;

        return {
            polyline: normalizedPoints.map(point => `${point.x},${point.y}`).join(' '),
            start: normalizedPoints[0] || null,
            current: normalizedCurrent
        };
    }

    return {
        tick,
        addPosition
    };
}

function normalizePosition(position) {
    const latitude = position?.coords?.latitude;
    const longitude = position?.coords?.longitude;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }

    return {
        latitude,
        longitude,
        accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : MAX_ACCEPTABLE_ACCURACY_METERS + 1,
        timestamp: Number.isFinite(position.timestamp) ? position.timestamp : Date.now()
    };
}

function haversineDistanceMeters(pointA, pointB) {
    const lat1 = toRadians(pointA.latitude);
    const lat2 = toRadians(pointB.latitude);
    const deltaLat = lat2 - lat1;
    const deltaLon = toRadians(pointB.longitude - pointA.longitude);

    const a = Math.sin(deltaLat / 2) ** 2
        + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_METERS * c;
}

function projectToLocalMeters(point, reference) {
    const meanLat = toRadians((point.latitude + reference.latitude) / 2);
    const x = (point.longitude - reference.longitude) * 111320 * Math.cos(meanLat);
    const y = (point.latitude - reference.latitude) * 110540;

    return { x, y };
}

function getProjectedBounds(points) {
    const initial = {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY
    };

    const bounds = points.reduce((acc, point) => ({
        minX: Math.min(acc.minX, point.x),
        maxX: Math.max(acc.maxX, point.x),
        minY: Math.min(acc.minY, point.y),
        maxY: Math.max(acc.maxY, point.y)
    }), initial);

    const spanX = Math.max(bounds.maxX - bounds.minX, 24);
    const spanY = Math.max(bounds.maxY - bounds.minY, 24);
    const centerX = (bounds.maxX + bounds.minX) / 2;
    const centerY = (bounds.maxY + bounds.minY) / 2;

    return {
        minX: centerX - spanX / 2,
        maxX: centerX + spanX / 2,
        minY: centerY - spanY / 2,
        maxY: centerY + spanY / 2
    };
}

function scaleRoutePoint(point, bounds) {
    const innerWidth = ROUTE_VIEWBOX.width - ROUTE_VIEWBOX.padding * 2;
    const innerHeight = ROUTE_VIEWBOX.height - ROUTE_VIEWBOX.padding * 2;
    const spanX = Math.max(bounds.maxX - bounds.minX, 1);
    const spanY = Math.max(bounds.maxY - bounds.minY, 1);
    const scale = Math.min(innerWidth / spanX, innerHeight / spanY);
    const x = ROUTE_VIEWBOX.padding + (point.x - bounds.minX) * scale;
    const y = ROUTE_VIEWBOX.height - (ROUTE_VIEWBOX.padding + (point.y - bounds.minY) * scale);

    return {
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2))
    };
}

function getGpsQuality(accuracy) {
    if (!Number.isFinite(accuracy)) return 'SEARCHING';
    if (accuracy <= 12) return 'STRONG';
    if (accuracy <= 25) return 'GOOD';
    if (accuracy <= 40) return 'OK';
    return 'WEAK';
}

function toRadians(value) {
    return value * (Math.PI / 180);
}
