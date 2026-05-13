import { Component, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Branch } from '../../models/branches.model';
import { BranchesService } from '../../service/branches.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './branches.component.html',
  styleUrls: ['./branches.component.scss']
})

export class BranchesComponent implements AfterViewInit, OnDestroy {

  private branchesService = inject(BranchesService);
  branches: Branch[] = this.branchesService.getAllBranches();
  selectedBranch: Branch | null = null;

  private map!: L.Map;
  private markers: L.Marker[] = [];

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    this.map = L.map('branches-map', {
      center: [32.0, 34.9],
      zoom: 8
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    }).addTo(this.map);

    // Fix grey tiles caused by container size not being finalised at init time
    setTimeout(() => this.map.invalidateSize(), 0);

    const icon = L.icon({
      iconUrl: 'assets/images/media_07062023144314.png',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });

    this.branches.forEach(branch => {
      if (branch.coordinates) {
        const marker = L.marker([branch.coordinates.lat, branch.coordinates.lng], { icon })
          .addTo(this.map)
          .bindPopup(`<b>${branch.name}</b><br>${branch.address}, ${branch.city}`);
        this.markers.push(marker);
      }
    });
  }

  goToBranch(branch: Branch): void {
    this.selectedBranch = branch;
    if (branch.coordinates && this.map) {
      this.map.setView([branch.coordinates.lat, branch.coordinates.lng], 15, {
        animate: true,
        duration: 0.4
      });

      const index = this.branches.indexOf(branch);
      if (this.markers[index]) {
        this.markers[index].openPopup();
      }
    }

    const mapEl = document.getElementById('branches-map');
    if (mapEl) {
      mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

