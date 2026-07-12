export class LWWRegister<T> {
  public value: T;
  public timestamp: number;
  public clientId: string;

  constructor(value: T, timestamp: number, clientId: string) {
    this.value = value;
    this.timestamp = timestamp;
    this.clientId = clientId;
  }

  /**
   * Merges a remote register into this register based on Last-Writer-Wins.
   * If the remote timestamp is strictly greater, it wins.
   * If timestamps are equal, we tie-break using the clientId (deterministic).
   */
  public merge(remote: LWWRegister<T>): void {
    if (remote.timestamp > this.timestamp) {
      this.value = remote.value;
      this.timestamp = remote.timestamp;
      this.clientId = remote.clientId;
    } else if (remote.timestamp === this.timestamp) {
      // Tie breaker: string comparison on clientId
      if (remote.clientId > this.clientId) {
        this.value = remote.value;
        this.timestamp = remote.timestamp;
        this.clientId = remote.clientId;
      }
    }
  }

  // To serialize over the wire
  public toJSON() {
    return {
      value: this.value,
      timestamp: this.timestamp,
      clientId: this.clientId
    };
  }

  // To deserialize from the wire
  public static fromJSON<T>(json: any): LWWRegister<T> {
    return new LWWRegister<T>(json.value, json.timestamp, json.clientId);
  }
}
