export class LifecycleEvents {
  private onMountCbs: Array<() => void> = [];
  private onUnmountCbs: Array<() => void> = [];
  private onUpdateCbs: Array<() => void> = [];

  public onMount(cb: () => void) {
    this.onMountCbs.push(cb);
  }

  public onUnmount(cb: () => void) {
    this.onUnmountCbs.push(cb);
  }

  public onUpdate(cb: () => void) {
    this.onUpdateCbs.push(cb);
  }

  public offMount(cb: () => void) {
    const index = this.onMountCbs.indexOf(cb);
    if (index !== -1) {
      this.onMountCbs.splice(index, 1);
    }
  }

  public offUnmount(cb: () => void) {
    const index = this.onUnmountCbs.indexOf(cb);
    if (index !== -1) {
      this.onUnmountCbs.splice(index, 1);
    }
  }

  public offUpdate(cb: () => void) {
    const index = this.onUpdateCbs.indexOf(cb);
    if (index !== -1) {
      this.onUpdateCbs.splice(index, 1);
    }
  }

  public update() {
    for (let i = 0; i < this.onUpdateCbs.length; i++) {
      try {
        this.onUpdateCbs[i]!();
      } catch (e) {
        console.error(e);
      }
    }
  }

  public mount() {
    for (let i = 0; i < this.onMountCbs.length; i++) {
      try {
        this.onMountCbs[i]!();
      } catch (e) {
        console.error(e);
      }
    }
  }

  public unmount() {
    for (let i = 0; i < this.onUnmountCbs.length; i++) {
      try {
        this.onUnmountCbs[i]!();
      } catch (e) {
        console.error(e);
      }
    }
  }
}
