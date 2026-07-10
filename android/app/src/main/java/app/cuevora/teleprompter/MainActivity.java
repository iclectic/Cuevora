package app.cuevora.teleprompter;

import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    @Override
    public void onResume() {
        super.onResume();
        this.bridge.getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                List<String> allowedResources = new ArrayList<>();
                for (String resource : request.getResources()) {
                    if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)
                            || PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                        allowedResources.add(resource);
                    }
                }

                if (allowedResources.isEmpty()) {
                    request.deny();
                    return;
                }

                request.grant(allowedResources.toArray(new String[0]));
            }
        });
    }
}
