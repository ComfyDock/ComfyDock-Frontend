// src/api/environmentApi.ts
import { Folder, UserSettingsInput } from '@/types/UserSettings';
import { Environment, EnvironmentInput, EnvironmentUpdate } from '../types/Environment';
import { ImageTag, InstalledImage } from '@/types/Images';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5172';

export async function fetchEnvironments(folderId?: string) {
  const response = await fetch(`${API_BASE_URL}/environments${folderId ? `?folderId=${folderId}` : ''}`);
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to fetch environments: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function createEnvironment(environment: EnvironmentInput) {
  console.log(`JSON output: ${JSON.stringify(environment)}`)
  const response = await fetch(`${API_BASE_URL}/environments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(environment),
  });
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to create environment: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function activateEnvironment(id: string, allow_multiple: boolean = false) {
  const response = await fetch(`${API_BASE_URL}/environments/${id}/activate?allow_multiple=${allow_multiple}`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to activate environment: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function deactivateEnvironment(id: string) {
  const response = await fetch(`${API_BASE_URL}/environments/${id}/deactivate`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to deactivate environment: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function deleteEnvironment(id: string) {
  const response = await fetch(`${API_BASE_URL}/environments/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to delete environment: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function duplicateEnvironment(id: string, environment: Environment) {
  const response = await fetch(`${API_BASE_URL}/environments/${id}/duplicate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(environment),
  });
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to duplicate environment: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function updateEnvironment(id: string, environment: EnvironmentUpdate) {
  const response = await fetch(`${API_BASE_URL}/environments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(environment),
  });
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to update environment: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function commitEnvironment(id: string, repo_name: string, tag_name: string) {
  const params = new URLSearchParams({
    repo_name,
    tag_name
  });
  
  const response = await fetch(`${API_BASE_URL}/environments/${id}/commit?${params}`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to commit environment: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export function connectToLogStream(environmentId: string, onLogReceived: (log: string) => void) {
  const eventSource = new EventSource(`${API_BASE_URL}/environments/${environmentId}/logs`);

  eventSource.onmessage = (event) => {
    onLogReceived(event.data);
  };

  eventSource.onerror = (error) => {
    console.error("Error receiving log stream:", error);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}

export async function checkValidComfyUIPath(comfyUIPath: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/comfyui/validate-path`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: comfyUIPath }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Handle structured error response
      const errorDetail = data.detail?.error || data.message || 'Unknown error';
      throw new Error(`${errorDetail}`);
    }

    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Validation error:', error.message);
      throw new Error(`Failed to validate path: ${error.message}`);
    } else {
      console.error('Validation error:', error);
      throw new Error('Failed to validate path');
    }
  }

}

export async function tryInstallComfyUI(comfyUIPath: string, branch: string = "master") {
  const response = await fetch(`${API_BASE_URL}/comfyui/install`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: comfyUIPath, branch: branch }),
  });
  console.log(response)
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to install ComfyUI: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function getUserSettings() {
  const response = await fetch(`${API_BASE_URL}/user-settings`);
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to get user settings: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function updateUserSettings(settings: UserSettingsInput) {
  const response = await fetch(`${API_BASE_URL}/user-settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to update user settings: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function getComfyUIImageTags(): Promise<{ tags: ImageTag[] }> {
  const response = await fetch(`${API_BASE_URL}/images/tags`);
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to get ComfyUI image tags: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function getInstalledImages(): Promise<{ images: InstalledImage[] }> {
  const response = await fetch(`${API_BASE_URL}/images/installed`);
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to get installed images: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function checkImageExists(image: string) {
  const encodedImage = encodeURIComponent(image)
  const response = await fetch(`${API_BASE_URL}/images/exists?image=${encodedImage}`);
  if (!response.ok) {
    return false;
  }
  return true;
}

export function pullImageStreamMock(image: string, onProgress: (progress: number) => void): Promise<void> {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      if (progress < 100) {
        progress += 10; // Increment progress by 10
        onProgress(progress);
      } else {
        clearInterval(interval);
        console.log("Image pull completed.");
        resolve();
      }
    }, 500); // Update progress every 500 milliseconds
  });
}

export function pullImageStream(image: string, onProgress: (progress: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const encodedImage = encodeURIComponent(image)
    const eventSource = new EventSource(`${API_BASE_URL}/images/pull?image=${encodedImage}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.error) {
        console.error("Error:", data.error);
        eventSource.close();
        reject(data.error);
        return;
      }

      if (data.progress !== undefined) {
        onProgress(data.progress);
      }

      if (data.status === 'completed') {
        console.log("Image pull completed.");
        eventSource.close();
        resolve();
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      eventSource.close();
      reject(err);
    };
  });
}

export async function createFolder(name: string): Promise<Folder> {
  const response = await fetch(`${API_BASE_URL}/user-settings/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!response.ok) {
    const errorDetails = await response.json();
    throw new Error(errorDetails.detail);
  }
  return response.json();
}

export async function updateFolder(id: string, name: string): Promise<Folder> {
  const response = await fetch(`${API_BASE_URL}/user-settings/folders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!response.ok) {
    const errorDetails = await response.json();
    throw new Error(errorDetails.detail);
  }
  return response.json();
}

export async function deleteFolder(id: string): Promise<{status: string}> {
  const response = await fetch(`${API_BASE_URL}/user-settings/folders/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const errorDetails = await response.json();
    throw new Error(errorDetails.detail);
  }
  return response.json();
}

// Add more functions for other API actions like update, delete, etc.