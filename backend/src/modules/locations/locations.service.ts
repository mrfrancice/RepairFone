import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Location, LocationType } from './entities/location.entity';

// Data for Côte d'Ivoire locations
const IVORY_COAST_DATA = {
  name: "Côte d'Ivoire",
  cities: [
    {
      name: 'Abidjan',
      latitude: 5.3600,
      longitude: -4.0083,
      communes: [
        {
          name: 'Abobo',
          quarters: ['Abobo Gare', 'Abobo Baoulé', 'PK18', 'Sagbé', 'Avocatier', 'Anonkoua-Kouté', 'Abobo-Doumé', 'Kennedy'],
        },
        {
          name: 'Adjamé',
          quarters: ['Adjamé Liberté', 'Adjamé Bracodi', '220 Logements', 'Williamsville', 'Forum', 'Renault-Billard'],
        },
        {
          name: 'Attécoubé',
          quarters: ['Attécoubé Centre', 'Locodjro', 'Agban Village', 'Santé 3', 'Mossikro'],
        },
        {
          name: 'Cocody',
          quarters: ['Angré', 'Riviera 1', 'Riviera 2', 'Riviera 3', 'Riviera Palmeraie', 'Riviera Faya', 'II Plateaux', 'Cocody Centre', 'Danga', 'Bonoumin', 'Ambassades', 'Riviera Golf'],
        },
        {
          name: 'Koumassi',
          quarters: ['Koumassi Centre', 'Remblais', 'Grand Campement', 'Sicogi', 'Zone Industrielle', 'Sopim'],
        },
        {
          name: 'Marcory',
          quarters: ['Zone 4', 'Zone 4C', 'Biétry', 'Anoumabo', 'Sans Fil', 'Marcory Résidentiel'],
        },
        {
          name: 'Plateau',
          quarters: ['Plateau Centre', 'Commerce', 'Indénié', 'Cité Administrative'],
        },
        {
          name: 'Port-Bouët',
          quarters: ['Vridi', 'Gonzagueville', 'Adjouffou', 'Jean Folly', 'Vridi Canal', 'Aéroport'],
        },
        {
          name: 'Treichville',
          quarters: ['Treichville Centre', 'Habitat', 'Avenue 17', 'Nanan Yamousso', 'Belleville'],
        },
        {
          name: 'Yopougon',
          quarters: ['Yopougon Maroc', 'Sideci', 'Wassakara', 'Niangon', 'Port-Bouët 2', 'Toits Rouges', 'Selmer', 'Banco', 'Kouté', 'Millionnaire', 'Ananeraie', 'Azito'],
        },
      ],
    },
    {
      name: 'Bouaké',
      latitude: 7.6833,
      longitude: -5.0167,
      communes: [
        {
          name: 'Bouaké Centre',
          quarters: ['Commerce', 'Zone Industrielle', 'Air France', 'Koko', 'Broukro'],
        },
        {
          name: 'Dar-es-Salam',
          quarters: ['Dar-es-Salam 1', 'Dar-es-Salam 2', 'Dar-es-Salam 3'],
        },
        {
          name: 'Sokoura',
          quarters: ['Sokoura Centre', 'N\'Gattakro'],
        },
      ],
    },
    {
      name: 'Yamoussoukro',
      latitude: 6.8206,
      longitude: -5.2767,
      communes: [
        {
          name: 'Yamoussoukro Centre',
          quarters: ['Centre-ville', 'Habitat', 'Millionnaire', 'Morofé', 'Dioulakro'],
        },
        {
          name: 'Assabou',
          quarters: ['Assabou Centre', 'Kokrénou'],
        },
      ],
    },
    {
      name: 'San-Pédro',
      latitude: 4.7486,
      longitude: -6.6363,
      communes: [
        {
          name: 'San-Pédro Centre',
          quarters: ['Centre-ville', 'Zone Portuaire', 'Séwéké', 'Bardot', 'Lac'],
        },
        {
          name: 'Zimbabwe',
          quarters: ['Zimbabwe 1', 'Zimbabwe 2'],
        },
      ],
    },
    {
      name: 'Korhogo',
      latitude: 9.4500,
      longitude: -5.6333,
      communes: [
        {
          name: 'Korhogo Centre',
          quarters: ['Centre-ville', 'Sinistré', 'Dem', 'Koko', 'Soba'],
        },
      ],
    },
    {
      name: 'Man',
      latitude: 7.4125,
      longitude: -7.5536,
      communes: [
        {
          name: 'Man Centre',
          quarters: ['Centre-ville', 'Domoraud', 'Libreville', 'Gbapleu'],
        },
      ],
    },
    {
      name: 'Daloa',
      latitude: 6.8744,
      longitude: -6.4502,
      communes: [
        {
          name: 'Daloa Centre',
          quarters: ['Centre-ville', 'Lobia', 'Gbeuliville', 'Orly', 'Kennedy'],
        },
        {
          name: 'Tazibouo',
          quarters: ['Tazibouo Centre', 'Huberson'],
        },
      ],
    },
  ],
};

@Injectable()
export class LocationsService implements OnModuleInit {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async onModuleInit(): Promise<void> {
    // Seed locations if empty
    const count = await this.locationRepository.count();
    if (count === 0) {
      await this.seedLocations();
    }
  }

  private async seedLocations(): Promise<void> {
    console.log('Seeding locations...');

    // Create country
    const country = this.locationRepository.create({
      name: IVORY_COAST_DATA.name,
      type: LocationType.COUNTRY,
      parentId: null,
      sortOrder: 0,
    });
    await this.locationRepository.save(country);

    // Create cities, communes, and quarters
    for (let cityIndex = 0; cityIndex < IVORY_COAST_DATA.cities.length; cityIndex++) {
      const cityData = IVORY_COAST_DATA.cities[cityIndex];

      const city = this.locationRepository.create({
        name: cityData.name,
        type: LocationType.CITY,
        parentId: country.id,
        latitude: cityData.latitude,
        longitude: cityData.longitude,
        sortOrder: cityIndex,
      });
      await this.locationRepository.save(city);

      for (let communeIndex = 0; communeIndex < cityData.communes.length; communeIndex++) {
        const communeData = cityData.communes[communeIndex];

        const commune = this.locationRepository.create({
          name: communeData.name,
          type: LocationType.COMMUNE,
          parentId: city.id,
          sortOrder: communeIndex,
        });
        await this.locationRepository.save(commune);

        for (let quarterIndex = 0; quarterIndex < communeData.quarters.length; quarterIndex++) {
          const quarterName = communeData.quarters[quarterIndex];

          const quarter = this.locationRepository.create({
            name: quarterName,
            type: LocationType.QUARTER,
            parentId: commune.id,
            sortOrder: quarterIndex,
          });
          await this.locationRepository.save(quarter);
        }
      }
    }

    console.log('Locations seeded successfully!');
  }

  async getCities(): Promise<Location[]> {
    return this.locationRepository.find({
      where: { type: LocationType.CITY, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async getCommunesByCity(cityId: string): Promise<Location[]> {
    return this.locationRepository.find({
      where: { type: LocationType.COMMUNE, parentId: cityId, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async getCommunesByCityName(cityName: string): Promise<Location[]> {
    const city = await this.locationRepository.findOne({
      where: { type: LocationType.CITY, name: cityName, isActive: true },
    });

    if (!city) {
      return [];
    }

    return this.getCommunesByCity(city.id);
  }

  async getQuartersByCommune(communeId: string): Promise<Location[]> {
    return this.locationRepository.find({
      where: { type: LocationType.QUARTER, parentId: communeId, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async getQuartersByCommuneName(communeName: string, cityName?: string): Promise<Location[]> {
    let communeQuery: any = { type: LocationType.COMMUNE, name: communeName, isActive: true };

    // If cityName is provided, find the commune within that city
    if (cityName) {
      const city = await this.locationRepository.findOne({
        where: { type: LocationType.CITY, name: cityName, isActive: true },
      });

      if (city) {
        communeQuery.parentId = city.id;
      }
    }

    const commune = await this.locationRepository.findOne({
      where: communeQuery,
    });

    if (!commune) {
      return [];
    }

    return this.getQuartersByCommune(commune.id);
  }

  async getLocationById(id: string): Promise<Location | null> {
    return this.locationRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
  }

  async getLocationHierarchy(locationId: string): Promise<{
    country?: Location;
    city?: Location;
    commune?: Location;
    quarter?: Location;
  }> {
    const location = await this.getLocationById(locationId);
    if (!location) {
      return {};
    }

    const result: any = {};

    let current: Location | null = location;
    while (current) {
      switch (current.type) {
        case LocationType.COUNTRY:
          result.country = current;
          break;
        case LocationType.CITY:
          result.city = current;
          break;
        case LocationType.COMMUNE:
          result.commune = current;
          break;
        case LocationType.QUARTER:
          result.quarter = current;
          break;
      }

      if (current.parentId) {
        current = await this.getLocationById(current.parentId);
      } else {
        current = null;
      }
    }

    return result;
  }

  // Get full location data for frontend
  async getFullLocationData(): Promise<{
    cities: Array<{
      id: string;
      name: string;
      latitude: number | null;
      longitude: number | null;
      communes: Array<{
        id: string;
        name: string;
        quarters: Array<{ id: string; name: string }>;
      }>;
    }>;
  }> {
    const cities = await this.getCities();
    const result: any = { cities: [] };

    for (const city of cities) {
      const communes = await this.getCommunesByCity(city.id);
      const cityData: any = {
        id: city.id,
        name: city.name,
        latitude: city.latitude,
        longitude: city.longitude,
        communes: [],
      };

      for (const commune of communes) {
        const quarters = await this.getQuartersByCommune(commune.id);
        cityData.communes.push({
          id: commune.id,
          name: commune.name,
          quarters: quarters.map((q) => ({ id: q.id, name: q.name })),
        });
      }

      result.cities.push(cityData);
    }

    return result;
  }
}
