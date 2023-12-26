import * as Aerospike from 'aerospike';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AerospikeService {
  private client: any;

  constructor() {
    const config = {
      hosts: 'localhost:3000',
    };

    this.client = new Aerospike.Client(config);

    this.client.connect((error) => {
      if (error) {
        console.error('Error connecting to Aerospike:', error);
      } else {
        console.log('Connected to Aerospike');
      }
    });
  }

  async put(
    key: any,
    record: any,
    policy: any,
  ): Promise<{ success: boolean; message?: string }> {
    return new Promise<{ success: boolean; message?: string }>(
      (resolve, reject) => {
        this.client.put(key, record, [], policy, (error) => {
          if (error) {
            console.log(error);

            if (error.code === Aerospike.status.AEROSPIKE_ERR_RECORD_EXISTS) {
              console.warn('Record with the same key already exists:', key);
              resolve({ success: false, message: 'Record already exists' });
            } else {
              console.error('Error during put operation:', error);
              reject({ success: false, message: 'Error during put operation' });
            }
          } else {
            console.log('Successfully stored record:', key);
            resolve({ success: true, message: 'Record stored successfully' });
          }
        });
      },
    );
  }

  async get(
    key: any,
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    return new Promise<{ success: boolean; data?: any; message?: string }>(
      (resolve, reject) => {
        this.client.get(key, (error, record) => {
          if (error) {
            console.error('Error during get operation:', error);
            reject({ success: false, message: 'Error during get operation' });
          } else {
            if (record) {
              console.log('Successfully retrieved record:', key);
              resolve({ success: true, data: record.bins });
            } else {
              console.warn('Record not found:', key);
              resolve({ success: false, message: 'Record not found' });
            }
          }
        });
      },
    );
  }

  async queryRecords(setName: string): Promise<any[]> {
    try {
      const scan = this.client.query('test', setName);
      const records = await scan.results();

      return records;
    } catch (error) {
      console.error('Error during queryRecords:', error);
      throw new Error('Internal Server Error');
    }
  }

  async operate(
    key: any,
    operations: any,
  ): Promise<{ success: boolean; error?: Aerospike.AerospikeError }> {
    try {
      const result = await new Promise<void>((resolve, reject) => {
        this.client.operate(key, operations, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      console.log('Successfully performed operate operation:', key);
      return { success: true };
    } catch (error) {
      console.error('Error during operate operation:', error);
      return { success: false, error };
    }
  }

  async closeConnection(): Promise<void> {
    return new Promise((resolve) => {
      this.client.close((error) => {
        if (error) {
          console.error('Error closing Aerospike connection:', error);
        } else {
          console.log('Aerospike connection closed');
        }
        resolve();
      });
    });
  }
}
