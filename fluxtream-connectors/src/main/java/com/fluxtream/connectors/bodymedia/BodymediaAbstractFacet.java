package com.fluxtream.connectors.bodymedia;

import javax.persistence.Lob;
import javax.persistence.MappedSuperclass;
import com.fluxtream.domain.AbstractFacet;

/**
 * <p>
 * <code>BodymediaAbstractFacet</code> does something...
 * </p>
 *
 * @author Prasanth Somasundar
 */
@MappedSuperclass
public abstract class BodymediaAbstractFacet extends AbstractFacet
{
    //The date that this facet represents
    public String date;
    public long lastSync = 0;
    @Lob
    public String Json;

    public void setDate(final String date) {
        this.date = date;
    }

    public void setLastSync(final long lastSync) {
        this.lastSync = lastSync;
    }

    public void setJson(final String json) {
        Json = json;
    }

    @Override
    protected void makeFullTextIndexable() {}
}