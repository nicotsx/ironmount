package volumes

import (
	"fmt"
	"strings"

	"k8s.io/utils/mount"
)

func UnmountVolume(path string) error {
	mounter := mount.New("")
	if err := mounter.Unmount(path); err != nil {
		if strings.Contains(err.Error(), "not mounted") || strings.Contains(err.Error(), "No such file or directory") || strings.Contains(err.Error(), "Invalid argument") {
			// Volume is not mounted
			return nil
		}
		return fmt.Errorf("failed to unmount volume at %s: %w", path, err)
	}
	return nil

}
