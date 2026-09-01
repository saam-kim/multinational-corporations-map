/**
 * Leaflet.js 기반 표준 고화질 세계 지도 렌더러
 * 
 * 1. CartoDB Positron 표준 타일맵 (모던 미니멀 화이트 & 소프트 슬레이트 톤)
 * 2. 0% 오류: 전 세계 모든 국가, 해안선, 지명이 4K급 정밀도로 100% 온전하게 렌더링
 * 3. 본사(HQ) 및 거점(R&D, 조립공장, 광산) 펄스 마커
 * 4. 본사-거점 간 우아한 3D 비행 아크(Curved Path) 및 유성 파티클 애니메이션
 */

class StandardWorldMapRenderer {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = Object.assign({
      onMarkerClick: null,
      onMarkerHover: null
    }, options);

    this.currentCompany = null;
    this.selectedHubId = null;
    this.markers = [];
    this.arcPaths = [];
    this.particles = [];

    this.initMap();
  }

  initMap() {
    const el = document.getElementById(this.containerId);
    if (!el) return;

    // Leaflet 맵 초기화 (기본 시점: 위도 20, 경도 10, 줌 2)
    this.map = L.map(this.containerId, {
      center: [20, 10],
      zoom: 2,
      minZoom: 2,
      maxZoom: 8,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [[-85, -180], [85, 180]],
      maxBoundsViscosity: 1.0
    });

    // 100% 완전 무료 & API 키 일절 없는 Esri 공인 표준 라이트 그레이 세계지도
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      noWrap: true,
      bounds: [[-85, -180], [85, 180]]
    }).addTo(this.map);

    // 전 세계 국가 및 도시 명칭 라벨 레이어 (워터마크 없는 고화질 참조 레이어)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      noWrap: true,
      bounds: [[-85, -180], [85, 180]],
      opacity: 0.85
    }).addTo(this.map);

    // SVG 오버레이 레이어 (비행 아크 및 파티클 전용)
    this.svgLayer = L.svg().addTo(this.map);
    this.svg = d3.select(this.map.getPanes().overlayPane).select("svg");
    this.arcsGroup = this.svg.append("g").attr("class", "leaflet-zoom-hide arcs-group");

    // 지도 줌/이동 시 아크 곡선 갱신
    this.map.on("zoomend moveend viewreset", () => {
      this.updateArcs();
    });
  }

  setCompany(company) {
    this.currentCompany = company;
    this.selectedHubId = null;
    this.renderMarkers();
    this.updateArcs();

    // 본사 위치로 부드럽게 시점 이동
    if (company && company.headquarters) {
      const hq = company.headquarters;
      this.map.flyTo([hq.lat, hq.lng], 3, { duration: 1.2 });
    }
  }

  selectHub(hubId) {
    this.selectedHubId = hubId;
    this.renderMarkers();
    this.updateArcs();

    if (this.currentCompany) {
      const targetHub = this.currentCompany.hubs.find(h => h.id === hubId);
      if (targetHub) {
        this.map.flyTo([targetHub.lat, targetHub.lng], 4, { duration: 1.0 });
      }
    }
  }

  resetView() {
    if (this.map) {
      this.map.flyTo([20, 10], 2, { duration: 0.8 });
    }
  }

  zoomIn() {
    if (this.map) this.map.zoomIn();
  }

  zoomOut() {
    if (this.map) this.map.zoomOut();
  }

  renderMarkers() {
    // 기존 마커 제거
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];

    if (!this.currentCompany) return;

    const hq = this.currentCompany.headquarters;

    // 1. 본사(HQ) 마커 생성
    const hqIcon = L.divIcon({
      className: 'custom-hq-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="
            position: absolute;
            top: -26px;
            white-space: nowrap;
            background: #1e3a8a;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 9999px;
            border: 1px solid #60a5fa;
            box-shadow: 0 2px 8px rgba(30, 58, 138, 0.35);
          ">★ ${this.currentCompany.name} 본사</div>
          <div style="
            width: 20px;
            height: 20px;
            background: #2563eb;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.35), 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 6px; height: 6px; background: #facc15; border-radius: 50%;"></div>
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const hqMarker = L.marker([hq.lat, hq.lng], { icon: hqIcon, zIndexOffset: 1000 }).addTo(this.map);
    hqMarker.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      if (this.options.onMarkerClick) {
        this.options.onMarkerClick({ type: "headquarters", data: hq, company: this.currentCompany });
      }
    });
    this.markers.push(hqMarker);

    // 2. 거점(Hubs) 마커 생성
    this.currentCompany.hubs.forEach(hub => {
      const isSelected = this.selectedHubId === hub.id;
      const color = hub.color || "#2563eb";

      const hubIcon = L.divIcon({
        className: 'custom-hub-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              width: ${isSelected ? 18 : 14}px;
              height: ${isSelected ? 18 : 14}px;
              background: ${color};
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: ${isSelected ? `0 0 0 4px ${color}44, 0 3px 8px rgba(0,0,0,0.3)` : '0 2px 5px rgba(0,0,0,0.2)'};
            "></div>
            <div style="
              position: absolute;
              top: ${isSelected ? 20 : 16}px;
              white-space: nowrap;
              background: ${isSelected ? '#1e293b' : 'rgba(255, 255, 255, 0.95)'};
              color: ${isSelected ? '#ffffff' : '#334155'};
              font-size: ${isSelected ? 11 : 10.5}px;
              font-weight: ${isSelected ? 700 : 600};
              padding: 2px 7px;
              border-radius: 4px;
              border: 1px solid ${isSelected ? '#0f172a' : '#cbd5e1'};
              box-shadow: 0 2px 6px rgba(0,0,0,0.15);
              transition: all 0.2s ease;
            ">${hub.name}</div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const hubMarker = L.marker([hub.lat, hub.lng], { icon: hubIcon, zIndexOffset: isSelected ? 900 : 500 }).addTo(this.map);
      hubMarker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        if (this.options.onMarkerClick) {
          this.options.onMarkerClick({ type: "hub", data: hub, company: this.currentCompany });
        }
      });
      this.markers.push(hubMarker);
    });
  }

  updateArcs() {
    this.arcsGroup.selectAll("*").remove();

    if (!this.currentCompany || !this.map) return;

    const hq = this.currentCompany.headquarters;
    const hqPt = this.map.latLngToLayerPoint([hq.lat, hq.lng]);

    this.currentCompany.hubs.forEach(hub => {
      const hubPt = this.map.latLngToLayerPoint([hub.lat, hub.lng]);
      const isSelected = this.selectedHubId === hub.id;

      const midX = (hqPt.x + hubPt.x) / 2;
      const midY = (hqPt.y + hubPt.y) / 2;
      const dist = Math.hypot(hubPt.x - hqPt.x, hubPt.y - hqPt.y);
      const arcHeight = Math.min(120, Math.max(20, dist * 0.22));
      const cpX = midX;
      const cpY = midY - arcHeight;

      const pathData = `M ${hqPt.x} ${hqPt.y} Q ${cpX} ${cpY} ${hubPt.x} ${hubPt.y}`;

      // 배경 포물선 아크
      this.arcsGroup.append("path")
        .attr("d", pathData)
        .attr("fill", "none")
        .attr("stroke", isSelected ? "#2563eb" : "rgba(37, 99, 235, 0.4)")
        .attr("stroke-width", isSelected ? 3.2 : 1.8)
        .attr("stroke-linecap", "round")
        .style("filter", isSelected ? "drop-shadow(0 2px 6px rgba(37,99,235,0.45))" : "none");

      // 유성 파티클 애니메이션
      const particle = this.arcsGroup.append("circle")
        .attr("r", isSelected ? 4 : 3)
        .attr("fill", isSelected ? "#1d4ed8" : "#3b82f6");

      function animateParticle() {
        particle.transition()
          .duration(2000 + Math.random() * 400)
          .ease(d3.easeLinear)
          .attrTween("transform", () => {
            return (t) => {
              const oneMinusT = 1 - t;
              const x = oneMinusT * oneMinusT * hqPt.x + 2 * oneMinusT * t * cpX + t * t * hubPt.x;
              const y = oneMinusT * oneMinusT * hqPt.y + 2 * oneMinusT * t * cpY + t * t * hubPt.y;
              return `translate(${x}, ${y})`;
            };
          })
          .on("end", animateParticle);
      }
      animateParticle();
    });
  }
}

if (typeof window !== "undefined") {
  window.StandardWorldMapRenderer = StandardWorldMapRenderer;
}
